import sqlite3
import json

db_path = "c:/Users/Vindhya M D/.gemini/antigravity/scratch/career-mirror-ai/backend/career_mirror.db"

# Connect to the SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# List of new columns to add to 'resumes'
columns_to_add = [
    ("file_type", "VARCHAR"),
    ("skill_languages", "JSON"),
    ("skill_frameworks", "JSON"),
    ("skill_tools", "JSON"),
    ("contact_info", "JSON"),
    ("education", "JSON"),
    ("experience", "JSON"),
    ("projects", "JSON"),
    ("certifications", "JSON"),
    ("sections_detected", "JSON"),
    ("embedding", "JSON")
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE resumes ADD COLUMN {col_name} {col_type};")
        print(f"Added column {col_name}")
    except sqlite3.OperationalError as e:
        print(f"Column {col_name} might already exist or error: {e}")

conn.commit()
conn.close()
print("Migration completed.")
