# CareerMirror AI

A full-stack AI-powered web application that evaluates job readiness, detects hidden skill gaps, generates adaptive practice sessions, and recommends matching job opportunities.

## System Architecture

- **Frontend**: Next.js App Router, TypeScript, Tailwind CSS, Zustand, Recharts, Framer Motion
- **Backend**: FastAPI, PostgreSQL (via SQLAlchemy), spaCy (Resume Parsing), sentence-transformers & FAISS (Semantic Job Matching)
- **Local LLM**: Ollama (`qwen2.5:0.5b` or `llama3`) for adaptive question generation

## Prerequisites

1.  **Node.js** (v18+)
2.  **Python** (3.10+)
3.  **Ollama**: Installed and running locally.
    *   Pull the required model: `ollama run qwen2.5:0.5b`

## Setup Instructions

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download the required spaCy NLP model
python -m spacy download en_core_web_md

# Run the FastAPI server
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 2. Frontend Setup

Open another terminal and navigate to the frontend directory:
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
The application will be available at `http://localhost:3000`.

## Key Features Implemented

1.  **Resume Upload + Skill Extraction Engine**: Uses `PyMuPDF` and `spaCy` to extract text and identify technical skills.
2.  **Role-Based Readiness Score**: Compares extracted skills with role graphs using `sentence-transformers` for semantic similarity.
3.  **Hidden Skill Gap Detection**: Infers missing implicit skills based on detected technologies.
4.  **Preparation Authenticity Score**: Detects shallow preparation signals (e.g., tutorial-only projects).
5.  **LLM-Based Adaptive Practice Session**: Generates MCQs and scenarios dynamically via Ollama.
6.  **Smart Job Recommendation Engine**: Fetches live jobs from Remotive API and uses FAISS vector search to match resumes. Jobs are locked until a minimum readiness threshold is met.

## Project Structure

- `backend/app/main.py`: FastAPI endpoints.
- `backend/app/services/`: Core logic (resume parser, skill engine, LLM service, job service).
- `frontend/app/page.tsx`: Main dashboard layout and navigation.
- `frontend/components/dashboard/`: UI components (Upload, Charts, Practice, Jobs).
- `frontend/services/`: Zustand state management stores.
