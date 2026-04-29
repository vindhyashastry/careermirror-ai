import httpx
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

if not GROQ_API_KEY:
    print("❌ ERROR: GROQ_API_KEY not found in .env. LLM features will fail.")

class LLMService:
    async def _call_llm(self, prompt, format_json=True, system_msg=None):
        """Strict Groq execution with support for system messages."""
        if not GROQ_API_KEY:
            return "{}"

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_msg:
            messages.append({"role": "system", "content": system_msg})
        messages.append({"role": "user", "content": prompt})
        
        # Groq requires "JSON" to be in the prompt if response_format is json_object
        if format_json and "json" not in prompt.lower():
            prompt += "\n\nResponse must be a valid JSON object."

        payload = {
            "model": "llama-3.1-8b-instant" if not system_msg else GROQ_MODEL,
            "messages": messages,
            "temperature": 0.0,
            "response_format": {"type": "json_object"} if format_json else None
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    return content.strip()
                else:
                    print(f"❌ Groq API Error: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Connection Error: {e}")
        return json.dumps({"reply": "I'm currently overloaded. Please try again in a moment.", "type": "text"})

    async def generate_questions(self, role, weak_skills, difficulty="intermediate", language="Python"):
        prompt = f"""
        Generate 3 {difficulty} practice questions for a {role} candidate.
        The candidate is weak in: {", ".join(weak_skills)}.
        Preferred programming language: {language}.
        
        Rules:
        1. LANGUAGE: Respond ONLY in English.
        2. Provide EXACTLY 4 distinct options for MCQs.
        1. One MCQ (with EXACTLY 4 options: A, B, C, D)
        2. One Coding logic question
        3. One Scenario-based interview question
        
        Return ONLY a JSON list of objects with fields: 'type', 'question', 'options' (list of 4 strings for MCQ), 'correct_answer', 'explanation'.
        """
        
        content = await self._call_llm(prompt)
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                for key in ["questions", "challenges", "data"]:
                    if key in data and isinstance(data[key], list):
                        return data[key]
                return [data] if data else []
            return data if isinstance(data, list) else []
        except:
            return []

    async def generate_mcqs(self, subject, difficulty="easy", count=3, exclude=[]):
        # Even stricter prompt for the small model
        exclude_str = ""
        if exclude:
            exclude_str = f"\n[CRITICAL] DO NOT REPEAT OR GENERATE QUESTIONS SIMILAR TO THESE:\n- " + "\n- ".join(exclude[:10])
        
        prompt = f"""
        [TASK] Generate {count} unique technical MCQs for subject: {subject.upper()}
        [STRICT RULES]
        1. TOPIC: ONLY {subject}. Do not mention other languages.
        2. EXCLUSIONS: {exclude_str}
        3. NO REPETITION: Every question must cover a fresh concept within {subject}.
        4. OPTIONS: Provide EXACTLY 4 options. NO MORE.
        
        [FORMAT] Return a JSON object with a 'questions' key containing the list of items.
        Fields for each question: 'question', 'options', 'correct_answer', 'explanation'.
        """
        
        content = await self._call_llm(prompt, system_msg=f"You are a technical examiner for {subject}. You MUST provide unique questions.")
        

        try:
            data = json.loads(content)
            if isinstance(data, dict):
                for k in ["questions", "mcqs", "data"]:
                    if k in data: data = data[k]; break
                if isinstance(data, dict): data = [data]
                
            if isinstance(data, list):
                # POST-PROCESS: Force exactly 4 options and VALIDATE correct_answer
                valid_data = []
                for item in data:
                    if "options" in item and isinstance(item["options"], list):
                        # Clean up strings (remove trailing spaces, etc.)
                        item["options"] = [str(o).strip() for o in item["options"][:4]]
                        if len(item["options"]) < 4: continue
                        
                        # Force correct_answer to be one of the options (Resilient check)
                        ca = str(item.get("correct_answer", "")).strip()
                        if ca not in item["options"]:
                            # Try to find a partial match or just pick the first option if it's completely missing
                            closest = next((o for o in item["options"] if ca.lower() in o.lower() or o.lower() in ca.lower()), None)
                            if closest:
                                item["correct_answer"] = closest
                            else:
                                # Fallback: if we can't match, just skip this specific question but don't crash
                                continue
                        else:
                            item["correct_answer"] = ca
                            
                        item["difficulty"] = difficulty 
                        valid_data.append(item)
                return valid_data
        except Exception as e:
            print(f"Error processing MCQs: {e}")
        return []
    async def generate_scenarios(self, subject, count=1):
        # Force the subject multiple times to prevent "SQL drift"
        prompt = f"""
        [TASK] Generate 1 high-quality technical coding scenario for {subject.upper()}.
        [STRICT RULE] THIS MUST BE ABOUT {subject.upper()}. DO NOT GENERATE SQL IF THE SUBJECT IS {subject.upper()}.
        [NO SPOILERS] The 'initial_code' MUST BE A SKELETON ONLY (e.g. 'def solve():\n    pass').
        
        [FORMAT] Return a single JSON object.
        [IMPORTANT] Return the object DIRECTLY. DO NOT nest it inside another key like 'scenario' or 'challenge'.
        
        Keys:
        - 'title': A short, descriptive title for the challenge.
        - 'statement': A real-world context or story for the problem (Mission Statement).
        - 'task': The specific technical requirement the user must implement.
        - 'initial_code': The starting code block for the user.
        - 'solution': The correct implementation.
        - 'explanation': A deep-dive into why the solution works.
        """
        
        content = await self._call_llm(prompt, system_msg="You are an expert technical challenge generator.")
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                # Check for list keys first
                for key in ["scenarios", "challenges", "data"]:
                    if key in data and isinstance(data[key], list):
                        data = data[key]
                        break
                else:
                    # Check for singular wrapper keys
                    for key in ["scenario", "challenge", "problem"]:
                        if key in data and isinstance(data[key], dict):
                            data = [data[key]]
                            break
                    else:
                        # Otherwise assume the dict is the scenario itself
                        data = [data]
            
            if isinstance(data, list):
                for sc in data:
                    # NORMALIZE KEYS (Fallback for inconsistent LLM field naming)
                    if "problem" in sc and "statement" not in sc: sc["statement"] = sc["problem"]
                    if "description" in sc and "statement" not in sc: sc["statement"] = sc["description"]
                    if "problem_statement" in sc and "statement" not in sc: sc["statement"] = sc["problem_statement"]
                    if "objective" in sc and "task" not in sc: sc["task"] = sc["objective"]
                    if "instruction" in sc and "task" not in sc: sc["task"] = sc["instruction"]
                    if "instructions" in sc and "task" not in sc: sc["task"] = sc["instructions"]

                    # AGGRESSIVE SPOILER GUARD: Wipe any starting code that looks like a solution
                    sol = sc.get("solution", "").strip()
                    ini = sc.get("initial_code", "").strip()
                    
                    if not ini or len(ini) > 80 or ini == sol or "return" in ini.lower() or "from" in ini.lower():
                        if subject.lower() == "sql":
                            sc["initial_code"] = "-- Write your SQL query here\n"
                        else:
                            sc["initial_code"] = "def solution():\n    # Write your code here\n    pass"
                return data
            return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Error processing scenarios: {e}")
        return []

    async def evaluate_scenario(self, subject, task, user_code, solution):
        prompt = f"""
        [TASK] You are an expert technical interviewer. Evaluate the user code for subject '{subject}'.
        [GUIDELINE] Different implementations that achieve the same result correctly should be rewarded. The 'Reference Solution' is for logical guidance, NOT a strict template.
        
        Task: {task}
        Reference Solution: {solution}
        User's Code: {user_code}
        
        Return ONLY a JSON object with fields: 'score' (0-3), 'feedback', 'is_correct' (boolean), 'explanation'.
        """
        
        content = await self._call_llm(prompt)
        try:
            return json.loads(content)
        except:
            return {"score": 0, "feedback": "Evaluation failed", "is_correct": False, "explanation": ""}

    async def generate_expected_skills(self, target_roles):
        """Generates a focused dict of expected skills and weights for target roles."""
        roles_str = ", ".join(target_roles)
        prompt = f"""
        [TASK] Identify the CORE technical stack for a {roles_str}.
        [STRICT RULES] 
        1. Limit to EXACTLY 8 most critical skills.
        2. DOMAIN PURITY: If the role is '{roles_str}', focus ONLY on that specific ecosystem. 
           - For 'Python Developer', do NOT include JavaScript, CSS, or Mobile Dev.
           - Stay within (Language, Backend Frameworks, Databases, specialized Tools).
        3. Weights: 5 (Critical), 4 (Essential), 3 (Expected), 2 (Bonus).
        
        [FORMAT] Return ONLY a raw JSON object: {{"SkillName": Weight}}
        """
        
        content = await self._call_llm(prompt)
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                return {str(k): int(v) for k, v in data.items() if isinstance(v, (int, float))}
        except Exception as e:
            print(f"Error generating expected skills: {e}")
        
        return {"Python": 5, "FastAPI": 4, "PostgreSQL": 4, "Docker": 3, "Git": 3, "AWS": 3, "Redis": 2, "Unit Testing": 4}

    async def extract_requirements_from_jd(self, jd_text):
        """Extracts technical requirements with extreme reliability."""
        preview = jd_text[:5000]
        system_msg = "You are a technical recruiter. Your task is to extract only HARD technical skills and their importance from a Job Description. Always return a valid JSON object."
        prompt = f"""
        Extract technical requirements from this JD. 
        Assign weight 1-5 (5=Critical). 
        Format: {{"SkillName": Weight}}
        
        JD: {preview}
        """
        
        content = await self._call_llm(prompt, system_msg=system_msg)
        
        # Retry logic if empty
        if content == "{}" or content == "[]":
            print("🔄 Empty JD extraction. Retrying with simple prompt...")
            content = await self._call_llm(f"List the top 5 technical skills needed for this job as JSON: {preview[:1000]}")

        try:

            
            data = json.loads(content)
            
            # Normalize nested data
            actual_data = data
            for key in ["requirements", "skills", "tech_stack"]:
                if key in data and isinstance(data[key], dict):
                    actual_data = data[key]
                    break
            
            cleaned = {}
            for k, v in actual_data.items():
                try:
                    weight = int(float(v))
                    cleaned[str(k)] = min(max(weight, 1), 5)
                except:
                    cleaned[str(k)] = 3
            
            return cleaned
        except Exception as e:
            print(f"Final parse error: {e}")
        
        return {}

    async def extract_skills_from_text(self, text):
        """Strictly extractive technical skill identification."""
        preview = text[:4000]
        prompt = f"""
        [TASK] Extract ONLY technical skills explicitly written in the resume text below.
        [STRICT RULES]
        1. NO INFERENCES: If they mention 'Web Apps' but not 'React', do NOT extract 'React'.
        2. TECHNICAL ONLY: Ignore soft skills (e.g., 'Leadership', 'Teamwork').
        3. NO ROLES: Do NOT extract 'Backend Developer' or 'Engineer' as a skill.
        4. VERBATIM: Use the names as they appear or their standard canonical form.
        
        [FORMAT] Return ONLY a JSON array of strings.
        
        Text: {preview}
        """
        
        content = await self._call_llm(prompt)
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return [str(s) for s in data if len(str(s)) < 30] # Filter out long sentences
        except Exception as e:
            print(f"Error extracting skills: {e}")
        
        return []

    async def generate_strategy(self, score, gaps, hidden_gaps):
        """Generates a short, punchy AI career strategy based on current metrics."""
        prompt = f"""
        [TASK] Generate a single, powerful 1-sentence career strategy/insight.
        [CONTEXT] User Readiness: {score}%. Gaps: {', '.join(gaps)}. Hidden Expectations: {', '.join(hidden_gaps)}.
        [STRICT RULE] Keep it under 25 words. Be professional and actionable.
        [FORMAT] Return ONLY the plain text string.
        """
        return await self._call_llm(prompt, format_json=False)

    async def audit_authenticity(self, text):
        """Uses LLM to evaluate if the resume content reflects real-world depth or just surface-level tutorials."""
        preview = text[:3000]
        prompt = f"""
        [TASK] Evaluate the 'Authenticity' of the following resume content.
        [CRITERIA] 
        - High Authenticity (80-100): Mentions specific deployment details, architectural choices, testing frameworks, or edge-case handling.
        - Medium (50-79): Professional experience mentioned but lacks specific technical deep-dives.
        - Low (0-49): Projects sound like generic tutorial clones (ToDo app, Weather app) without custom extensions.
        
        [FORMAT] Return ONLY a JSON object: {{"score": int, "reason": "short string"}}
        
        Text: {preview}
        """
        content = await self._call_llm(prompt)
        try:
            return json.loads(content)
        except:
            return {"score": 75, "reason": "Consistent professional presentation with standard tech stack."}

    async def generate_market_heatmap(self, user_skills):
        """Generates a matrix of Market Demand vs Skill Strength for the user's domain."""
        skills_str = ", ".join(user_skills[:20])
        prompt = f"""
        [TASK] Create a Market vs Skill heatmap matrix for a candidate with these skills: {skills_str}.
        [ROLES] Frontend Developer, Backend Developer, Fullstack Engineer, AI/ML Engineer, DevOps Engineer.
        [CATEGORIES] Languages, Frameworks, Cloud/Infra, Soft Skills, Specialized Tech.
        
        [LOGIC] 
        - For each (Role, Category), assign a 'demand' (1-5) based on current market trends.
        - For each (Role, Category), assign a 'user_strength' (1-5) based on how well the user's skills ({skills_str}) fit that category for that specific role.
        
        [FORMAT] Return a JSON object:
        {{
            "roles": ["Role 1", "Role 2", ...],
            "categories": ["Cat 1", "Cat 2", ...],
            "matrix": [
                [ {{"demand": int, "strength": int}}, ... ], // Rows for Role 1
                ...
            ]
        }}
        """
        content = await self._call_llm(prompt)
        
        fallback_data = {
            "roles": ["Frontend", "Backend", "Fullstack", "AI/ML", "DevOps"],
            "categories": ["Languages", "Frameworks", "Cloud", "Soft Skills", "Tools"],
            "matrix": [[{"demand": 3, "strength": 2} for _ in range(5)] for _ in range(5)]
        }

        try:
            data = json.loads(content)
            # Validate structure
            if all(key in data for key in ["roles", "categories", "matrix"]):
                return data
            return fallback_data
        except:
            return fallback_data

llm_service = LLMService()
