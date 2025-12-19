import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 1. SETUP YOUR API KEY
# Replace 'YOUR_GEMINI_API_KEY' with your actual key from AI Studio
genai.configure(api_key="YOUR_GEMINI_API_KEY")
model = genai.GenerativeModel('gemini-pro')

# --- HELPER FUNCTION FOR AI CALLS ---
def ask_gemini(prompt):
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI Error: {str(e)}"

# --- ENDPOINTS ---

@app.route('/getHints', methods=['POST'])
def get_hints():
    data = request.json
    title = data.get('problemTitle', 'this problem')
    level = data.get('currentHintLevel', 0)
    
    prompt = (
        f"You are a LeetCode mentor. Provide a very subtle 'Level {level+1}' hint for '{title}'. "
        "Do not provide code. Just guide the user's thinking towards the right data structure or logic."
    )
    
    hint = ask_gemini(prompt)
    return jsonify({"hint": hint})

@app.route('/getExplanation', methods=['POST'])
def get_explanation():
    data = request.json
    title = data.get('problemTitle', 'this problem')
    
    prompt = (
        f"Explain the optimal logic for the LeetCode problem '{title}'. "
        "Use Markdown, use '###' for headers, and explain time/space complexity."
    )
    
    explanation = ask_gemini(prompt)
    return jsonify({"explanation": explanation})

@app.route('/getSolution', methods=['POST'])
def get_solution():
    data = request.json
    title = data.get('problemTitle', 'this problem')
    lang = data.get('language', 'Python')
    
    prompt = (
        f"Provide a clean, optimized {lang} solution for LeetCode '{title}'. "
        "Wrap the code in triple backticks and add brief comments explaining the steps."
    )
    
    solution = ask_gemini(prompt)
    return jsonify({"solution": solution})

# --- STUBS FOR FAVORITES (To prevent errors) ---
@app.route('/saveFavorite', methods=['POST'])
def save_fav(): return jsonify({"status": "success"})

@app.route('/getFavorites', methods=['GET'])
def get_favs(): return jsonify([])

if __name__ == '__main__':
    # Running on port 5000 to match your popup.js API_URL
    app.run(port=5000, debug=True)
