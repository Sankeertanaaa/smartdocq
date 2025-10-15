import os
import sqlite3
from dotenv import load_dotenv
import PyPDF2
import google.generativeai as genai

# ✅ Load environment variablespytho
load_dotenv("C:/Users/budig/OneDrive/Desktop/SmartDocQ/.env")

# ✅ Get API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env file")

# ✅ Configure Gemini
genai.configure(api_key=GOOGLE_API_KEY)

# ✅ Database setup
DB_NAME = "smartdocq.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            content TEXT
        )
    """)
    conn.commit()
    conn.close()

# ✅ PDF Upload & Store
def upload_pdf(file_path):
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO documents (filename, content) VALUES (?, ?)", (os.path.basename(file_path), text))
    conn.commit()
    conn.close()
    print(f"✅ {file_path} uploaded successfully!")

# ✅ Ask Gemini a question
def ask_gemini(question):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM documents")
    docs = cursor.fetchall()
    conn.close()

    if not docs:
        return "⚠ No documents found. Please upload a PDF first."

    # Merge all document content
    context = "\n".join([doc[0] for doc in docs])

    # Prompt Gemini
    prompt = f"Answer the following question using the given document:\n\nDocument:\n{context}\n\nQuestion: {question}"

    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)

    return response.text

# ✅ Main menu
def main():
    init_db()
    while True:
        print("\n--- SmartDocQ ---")
        print("1. Upload PDF")
        print("2. Ask a Question")
        print("3. Exit")
        choice = input("Enter choice: ")

        if choice == "1":
            path = input("Enter PDF file path: ")
            if os.path.exists(path):
                upload_pdf(path)
            else:
                print("❌ File not found")
        elif choice == "2":
            query = input("Enter your question: ")
            answer = ask_gemini(query)
            print("\n🤖 Gemini Answer:\n", answer)
        elif choice == "3":
            print("👋 Exiting SmartDocQ")
            break
        else:
            print("⚠ Invalid choice. Try again.")

if __name__ == "__main__":
    main()
