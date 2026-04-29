from sentence_transformers import util
import torch
import json
from .ai_utils import get_embedding_model

class SkillEngine:
    def __init__(self):
        # We don't store the model here, we fetch it when needed to ensure lazy loading
        pass

    def calculate_readiness(self, extracted_skills, role_skills):
        """
        role_skills: Dict of skill: weight (1-5)
        """
        model = get_embedding_model()
        if not model or not role_skills:
            return 0.0, []

        role_skills_list = list(role_skills.keys())
        
        # Semantic matching for each role skill
        gaps = []
        
        # We use a higher threshold to avoid "skill drift" (e.g. Python != Java)
        STRICT_THRESHOLD = 0.82 
        
        user_embeddings = model.encode(extracted_skills, convert_to_tensor=True)
        role_embeddings = model.encode(role_skills_list, convert_to_tensor=True)
        
        cosine_scores = util.cos_sim(role_embeddings, user_embeddings)
        
        weighted_score = 0
        total_possible_weight = sum(role_skills.values())
        
        for i, role_skill in enumerate(role_skills_list):
            max_sim = torch.max(cosine_scores[i]).item()
            weight = role_skills[role_skill]
            
            if max_sim >= STRICT_THRESHOLD:
                # Direct or very close match
                weighted_score += weight
            elif max_sim > 0.65:
                # Partial/Related match (give 40% credit for tangential skills)
                weighted_score += (weight * 0.4)
            else:
                # Absolute gap
                gaps.append(role_skill)
                
        readiness_percentage = (weighted_score / total_possible_weight) * 100 if total_possible_weight > 0 else 0
        return round(readiness_percentage, 1), gaps

    def calculate_authenticity_score(self, text):
        """
        Detect shallow preparation signals like tutorial-only projects.
        """
        tutorial_keywords = ["todo list", "clone", "weather app", "calculator", "beginner project"]
        deployment_keywords = ["aws", "heroku", "vercel", "docker", "ci/cd", "github actions", "production"]
        testing_keywords = ["pytest", "jest", "unit test", "integration test", "cypress"]
        
        text_lower = text.lower()
        score = 80 # Base score
        
        for kw in tutorial_keywords:
            if kw in text_lower:
                score -= 10
        
        has_deployment = any(kw in text_lower for kw in deployment_keywords)
        has_testing = any(kw in text_lower for kw in testing_keywords)
        
        if not has_deployment:
            score -= 15
        if not has_testing:
            score -= 15
            
        return max(0, min(100, score))
