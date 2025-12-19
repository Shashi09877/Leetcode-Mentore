from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows your Chrome extension to talk to this server

@app.route('/get-hint', methods=['POST'])
def get_hint():
    data = request.json
    problem_text = data.get('problem', '')
    
    # This is where the AI "magic" will happen later
    # For now, we are making sure the connection works!
    ai_response = f"I received your problem: {problem_text[:50]}... My hint is: Try using a Hash Map!"
    
    return jsonify({"hint": ai_response})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
