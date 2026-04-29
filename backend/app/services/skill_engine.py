import json

class SkillEngine:
    def __init__(self):
        # AI Models removed for memory optimization on Render Free Tier
        pass

    def calculate_readiness(self, extracted_skills, role_skills):
        """
        role_skills: Dict of skill: weight (1-5)
        Simplified keyword-based matching to save memory.
        """
        if not role_skills:
            return 0.0, []

        extracted_set = set(s.lower() for s in extracted_skills)
        role_skills_list = list(role_skills.keys())
        
        gaps = []
        weighted_score = 0
        total_possible_weight = sum(role_skills.values())
        
        for role_skill, weight in role_skills.items():
            if role_skill.lower() in extracted_set:
                weighted_score += weight
            else:
                # Check for partial matches (e.g. "React" in "React.js")
                matched = False
                for user_skill in extracted_set:
                    if role_skill.lower() in user_skill or user_skill in role_skill.lower():
                        weighted_score += weight * 0.8 # Give 80% credit for close keywords
                        matched = True
                        break
                
                if not matched:
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
