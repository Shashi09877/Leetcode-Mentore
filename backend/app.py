from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/getHints', methods=['POST'])
def get_hints():
    data = request.json
    title = data.get('problemTitle')
    level = data.get('currentHintLevel')
    # Later: Connect to Gemini/OpenAI here
    return jsonify({"hint": f"Hint {level+1} for {title}: Think about the constraints!"})

@app.route('/getExplanation', methods=['POST'])
def get_explanation():
    data = request.json
    title = data.get('problemTitle')
    return jsonify({"explanation": f"### Analysis of {title}\nThis problem requires a **Greedy** approach. \n\n```python\n# Logic here\n```"})

@app.route('/getSolution', methods=['POST'])
def get_solution():
    data = request.json
    title = data.get('problemTitle')
    lang = data.get('language')
    return jsonify({"solution": f"### {lang} Solution for {title}\n```javascript\nconsole.log('Solution');\n```"})

# Add placeholders for favorites to prevent errors
@app.route('/saveFavorite', methods=['POST'])
def save_fav(): return jsonify({"status": "success"})

@app.route('/getFavorites', methods=['GET'])
def get_favs(): return jsonify([])

if __name__ == '__main__':
    app.run(port=5000, debug=True)
