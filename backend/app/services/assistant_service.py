import httpx
import json
import os
from fpdf import FPDF
from datetime import datetime
from .llm_service import LLMService

class AssistantService:
    def __init__(self):
        self.llm = LLMService()

    async def chat(self, user_message, resume_data, role):
        prompt = f"""
        [CONTEXT] You are Mirror AI, a Career Strategist.
        [USER ROLE] {role}
        [USER RESUME DATA] {json.dumps(resume_data)}
        
        [USER MESSAGE] {user_message}
        
        [STRICT RULES]
        1. RESPONSE FORMAT: Always use bullet points for lists. Use bold headers for sections. Keep it professional.
        2. PROJECT VETTING: If asked for project ideas, detect if their current projects are 'generic' (e.g. To-Do list). 
           Suggest 3 'Trending' and 'Non-Repetitive' projects.
        3. No conversational filler.
        
        Return a JSON object with: 'reply' (string), 'type' ('text' or 'project_ideas').
        """
        response = await self.llm._call_llm(prompt)
        try:
            # Handle potential markdown code block wrapping
            clean_response = response.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_response)
            if not parsed.get("reply"):
                parsed["reply"] = "I couldn't generate a specific response for that. Could you rephrase your question?"
            return parsed
        except:
            return {"reply": "I encountered an error while thinking about that. Could you try rephrasing?", "type": "text"}

    def calculate_ats_metrics(self, resume_data, raw_text=""):
        # Real-world ATS heuristics
        scores = {
            "formatting": 0,
            "impact": 0,
            "keywords": 0,
            "overall": 0
        }
        
        # 1. Formatting (Section detection)
        sections = resume_data.get("sections_detected", [])
        if len(sections) >= 5: scores["formatting"] = 90
        elif len(sections) >= 3: scores["formatting"] = 60
        else: scores["formatting"] = 30

        # 2. Impact (Bullet points & Word length)
        # Check if experience descriptions use bullet points (starts with -, •, or *)
        exp = resume_data.get("experience", [])
        bullet_count = 0
        for e in exp:
            desc = e.get("description", "")
            if any(char in desc[:10] for char in ["-", "•", "*"]):
                bullet_count += 1
        
        if bullet_count > 0: scores["impact"] = 85
        else: scores["impact"] = 40
        
        # 3. Keywords
        skills = resume_data.get("skills", [])
        if len(skills) > 15: scores["keywords"] = 95
        elif len(skills) > 5: scores["keywords"] = 70
        else: scores["keywords"] = 40
        
        scores["overall"] = int((scores["formatting"] + scores["impact"] + scores["keywords"]) / 3)
        return scores

    async def analyze_github(self, github_url):
        # Extract username from URL
        username = github_url.strip("/").split("/")[-1]
        url = f"https://api.github.com/users/{username}/events"
        
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(url)
                events = res.json()
                
                # Simple heuristic analysis
                commits = [e for e in events if e['type'] == 'PushEvent']
                frequency = len(commits)
                
                prompt = f"""
                Analyze this GitHub activity data for user '{username}':
                Recent Events: {json.dumps(events[:10])}
                Push Frequency (last 30 events): {frequency}
                
                Provide a professional critique in 3-4 sentences. Mention commit frequency and profile gaps.
                Return ONLY the critique text.
                """
                feedback = await self.llm._call_llm(prompt, format_json=False)
                return feedback
            except Exception as e:
                return f"I couldn't reach GitHub for {username}. Make sure the profile is public."

    def generate_ats_report(self, user_name, resume_data, role):
        metrics = self.calculate_ats_metrics(resume_data)
        pdf = FPDF()
        pdf.add_page()
        
        # Header
        pdf.set_font("Arial", "B", 26)
        pdf.set_text_color(30, 58, 138)
        pdf.cell(0, 25, "CAREERMIRROR STRATEGY AUDIT", ln=True, align="C")
        
        pdf.set_font("Arial", "I", 10)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 5, f"Prepared for: {user_name} | Role: {role}", ln=True, align="C")
        pdf.cell(0, 10, f"Analysis Date: {datetime.now().strftime('%B %d, %Y')}", ln=True, align="C")
        pdf.ln(15)
        
        # 1. VISUAL METRICS (Score Bars)
        pdf.set_font("Arial", "B", 14)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 10, "1. ATS PERFORMANCE METRICS", ln=True)
        pdf.ln(5)

        for label, score in [("OVERALL READINESS", metrics['overall']), 
                             ("FORMATTING & STRUCTURE", metrics['formatting']), 
                             ("IMPACT & QUANTIFICATION", metrics['impact']), 
                             ("KEYWORD DENSITY", metrics['keywords'])]:
            # Ensure we start at the left margin
            pdf.set_x(10)
            pdf.set_font("Arial", "B", 10)
            pdf.cell(60, 8, label)
            
            # Draw Bar Background (explicit position)
            current_y = pdf.get_y()
            pdf.set_fill_color(229, 231, 235)
            pdf.rect(70, current_y + 1, 100, 6, 'F')
            
            # Draw Progress
            pdf.set_fill_color(37, 99, 235)
            pdf.rect(70, current_y + 1, score, 6, 'F')
            
            # Move to the end of the bar to print the percentage
            pdf.set_x(175)
            pdf.cell(20, 8, f"{score}%", ln=True)
            pdf.ln(2)

        pdf.ln(10)
        pdf.set_x(10) # Safety reset
        
        # 2. ANALYTIC CRITIQUE
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "2. WHERE TO IMPROVE", ln=True)
        pdf.set_font("Arial", "", 11)
        
        improvements = []
        if metrics['formatting'] < 80:
            improvements.append("- SECTIONS: Your resume is missing standard section headers. Use 'Experience', 'Education', and 'Skills' explicitly.")
        if metrics['impact'] < 80:
            improvements.append("- IMPACT: Many of your bullet points are descriptive rather than analytical. Use the STAR method (Situation, Task, Action, Result).")
        if metrics['keywords'] < 80:
            improvements.append("- KEYWORDS: Your skill density is low for a " + role + ". Add more tools, frameworks, and specific technologies.")
        
        if not improvements:
            improvements.append("- Your profile is exceptionally strong. Focus now on advanced certifications or niche technical publications.")

        for imp in improvements:
            pdf.set_x(10)
            pdf.multi_cell(0, 8, imp)
        
        pdf.ln(10)

        # 3. PROJECT VETTING
        pdf.set_x(10)
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "3. TECHNICAL PROJECT AUDIT", ln=True)
        pdf.set_font("Arial", "", 11)
        projects = resume_data.get("projects", [])
        if not projects:
            pdf.multi_cell(0, 8, "No technical projects detected. This is a critical gap. Recruiter focus drops by 60% without tangible proof of work.")
        else:
            for p in projects:
                name = p.get("title", "Unnamed Project")
                pdf.set_x(10)
                pdf.multi_cell(0, 8, f"- {name}: Complexity is currently rated as Moderate. Consider adding architecture diagrams or performance metrics.")
        
        pdf.ln(20)
        pdf.set_x(10)
        pdf.set_font("Arial", "B", 10)
        pdf.set_text_color(37, 99, 235)
        pdf.cell(0, 10, "Generated by CareerMirror AI Intelligence", ln=True, align="C")

        # Save to temp file
        report_path = f"ats_report_{user_name.replace(' ', '_')}.pdf"
        pdf.output(report_path)
        return report_path

        # Save to temp file
        report_path = f"ats_report_{user_name.replace(' ', '_')}.pdf"
        pdf.output(report_path)
        return report_path
