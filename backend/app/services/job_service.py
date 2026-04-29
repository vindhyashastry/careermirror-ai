import httpx
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

class JobService:
    def __init__(self):
        self.model = model
        self.jobs_cache = []
        self.index = None

    async def fetch_remote_jobs(self):
        url = "https://remotive.com/api/remote-jobs?limit=50"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                self.jobs_cache = data.get("jobs", [])
                self._build_index()
                return self.jobs_cache
            return []

    def _build_index(self):
        if not self.jobs_cache:
            return
        
        descriptions = [f"{j['title']} {j['category']} {j['description'][:500]}" for j in self.jobs_cache]
        embeddings = self.model.encode(descriptions)
        
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))

    def match_jobs(self, resume_text, user_skills=[], top_k=5):
        if self.index is None or not self.jobs_cache:
            return []
            
        resume_embedding = self.model.encode([resume_text])
        distances, indices = self.index.search(np.array(resume_embedding).astype('float32'), top_k)
        
        matches = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.jobs_cache):
                job = self.jobs_cache[idx]
                
                # Base similarity from vector search
                base_sim = float(1 / (1 + distances[0][i]))
                
                # Skill-boost logic: check if job keywords match user skills
                job_text = f"{job['title']} {job['category']} {job['description']}".lower()
                skill_matches = 0
                if user_skills:
                    for skill in user_skills:
                        if skill.lower() in job_text:
                            skill_matches += 1
                    
                    skill_boost = min(0.3, (skill_matches / max(1, len(user_skills))) * 0.5)
                else:
                    skill_boost = 0
                
                # Final score: Combine base similarity with skill boost and normalize
                # We aim to bring this closer to the 0.7-0.9 range for good matches
                final_score = min(0.98, (base_sim * 0.7) + 0.3 + skill_boost)
                
                matches.append({
                    "title": job["title"],
                    "company": job["company_name"],
                    "url": job["url"],
                    "similarity": final_score
                })
        
        # Sort by similarity
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        return matches
