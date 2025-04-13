@app.route('/process-selection', methods=['POST'])
def handle_selection():
    try:
        data = request.json
        selection = data.get('text', '').strip()
        if not selection:
            return jsonify({"error": "Empty selection"}), 400
            
        result = process_text(selection)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
