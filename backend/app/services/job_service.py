import httpx
import numpy as np
import re
import os
from typing import List, Dict

class JobService:
    def __init__(self):
        self.jobs_cache = []
        self.last_fetch = None
        self.rapidapi_key = os.getenv("RAPIDAPI_KEY")

    async def fetch_remote_jobs(self, query: str = "Software Engineer", location: str = "India"):
        """Fetches jobs from JSearch API or falls back to mock data."""
        
        if not self.rapidapi_key or "your_rapidapi_key" in self.rapidapi_key:
            print("⚠️ No RapidAPI key found. Using mock jobs.")
            self.jobs_cache = self._get_mock_jobs()
            return

        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key": self.rapidapi_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
        params = {
            "query": f"{query} in {location}",
            "page": "1",
            "num_pages": "1"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    raw_jobs = data.get("data", [])
                    self.jobs_cache = [
                        {
                            "id": j.get("job_id"),
                            "title": j.get("job_title"),
                            "company": j.get("employer_name"),
                            "logo": j.get("employer_logo"),
                            "category": j.get("job_employment_type", "Full-time"),
                            "description": j.get("job_description", ""),
                            "url": j.get("job_apply_link")
                        }
                        for j in raw_jobs
                    ]
                else:
                    print(f"❌ JSearch API Error: {response.status_code}")
                    self.jobs_cache = self._get_mock_jobs()
        except Exception as e:
            print(f"❌ JSearch Connection Error: {e}")
            self.jobs_cache = self._get_mock_jobs()

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

    def _get_mock_jobs(self):
        return [
            {"id": 1, "title": "Fullstack Developer", "company": "TechCorp", "logo": None, "category": "Engineering", "description": "Looking for React and FastAPI experts.", "url": "https://linkedin.com/jobs/view/1"},
            {"id": 2, "title": "Backend Engineer", "company": "DataSystems", "logo": None, "category": "Engineering", "description": "Python, PostgreSQL, and AWS knowledge required.", "url": "https://linkedin.com/jobs/view/2"},
            {"id": 3, "title": "Frontend Lead", "company": "CreativeUI", "logo": None, "category": "Design", "description": "Master of Tailwind CSS and Next.js.", "url": "https://linkedin.com/jobs/view/3"},
            {"id": 4, "title": "Python Developer", "company": "AI Innovators", "logo": None, "category": "AI", "description": "Build scalable APIs with Python and Docker.", "url": "https://linkedin.com/jobs/view/4"},
            {"id": 5, "title": "DevOps Engineer", "company": "CloudCloud", "logo": None, "category": "Infrastructure", "description": "Manage Kubernetes clusters and CI/CD pipelines.", "url": "https://linkedin.com/jobs/view/5"},
        ]
