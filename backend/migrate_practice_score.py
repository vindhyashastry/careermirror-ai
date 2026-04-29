import sqlite3

db_path = "c:/Users/Vindhya M D/.gemini/antigravity/scratch/career-mirror-ai/backend/career_mirror.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE readiness_scores ADD COLUMN practice_score FLOAT DEFAULT 0.0;")
    print("Added column practice_score to readiness_scores")
except sqlite3.OperationalError as e:
    print(f"Error or column already exists: {e}")

conn.commit()
conn.close()
print("Migration completed.")
