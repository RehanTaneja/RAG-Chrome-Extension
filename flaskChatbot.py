from flask import Flask, request, jsonify
from rag import get_contextual_definition  # Reusing your RAG function

app = Flask(__name__)

@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        data = request.json
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({"error": "Question cannot be empty"}), 400
        
        # Get the response from RAG based on the question
        response = get_contextual_definition(question)
        
        return jsonify({"answer": response})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5002)
