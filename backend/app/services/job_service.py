import httpx
import numpy as np
import re

class JobService:
    def __init__(self):
        # AI Models removed for memory optimization
        self.jobs_cache = []
        self.last_fetch = None

    async def fetch_remote_jobs(self):
        """Mock remote job fetching."""
        # In a real app, this would hit an API like JSearch or Adzuna
        self.jobs_cache = [
            {"id": 1, "title": "Fullstack Developer", "company": "TechCorp", "category": "Engineering", "description": "Looking for React and FastAPI experts.", "url": "https://linkedin.com/jobs/view/1"},
            {"id": 2, "title": "Backend Engineer", "company": "DataSystems", "category": "Engineering", "description": "Python, PostgreSQL, and AWS knowledge required.", "url": "https://linkedin.com/jobs/view/2"},
            {"id": 3, "title": "Frontend Lead", "company": "CreativeUI", "category": "Design", "description": "Master of Tailwind CSS and Next.js.", "url": "https://linkedin.com/jobs/view/3"},
            {"id": 4, "title": "Python Developer", "company": "AI Innovators", "category": "AI", "description": "Build scalable APIs with Python and Docker.", "url": "https://linkedin.com/jobs/view/4"},
            {"id": 5, "title": "DevOps Engineer", "company": "CloudCloud", "category": "Infrastructure", "description": "Manage Kubernetes clusters and CI/CD pipelines.", "url": "https://linkedin.com/jobs/view/5"},
        ]

    def match_jobs(self, resume_text, user_skills=[], top_k=5):
        """Simple keyword-based matching for job recommendations."""
        if not self.jobs_cache:
            return []

        resume_lower = resume_text.lower()
        user_skills_lower = [s.lower() for s in user_skills]
        
        results = []
        for job in self.jobs_cache:
            score = 0
            job_text = f"{job['title']} {job['category']} {job['description']}".lower()
            
            # Count skill matches
            match_count = 0
            for skill in user_skills_lower:
                if skill in job_text:
                    match_count += 1
            
            if user_skills_lower:
                score += (match_count / len(user_skills_lower)) * 0.7
            
            # Title match bonus
            if any(word in job['title'].lower() for word in resume_lower.split()[:20] if len(word) > 3):
                score += 0.3
                
            results.append({**job, "similarity": min(1.0, score)})
            
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]
