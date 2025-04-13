from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict
import pdfplumber
import re

app = Flask(__name__)
CORS(app)  # Enable CORS to allow frontend communication

@app.route('/get-pdf-path', methods=['POST'])
def get_pdf_path():
    data = request.json
    url = data.get('url', '').strip()

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    parsed_url = urlparse(url)
    path = parsed_url.path
    return path

def extract_sections(pdf_path) -> dict:
    sections = defaultdict(list)
    current_section = "Introduction"
    heading_pattern = re.compile(r'^(\d+\.\d*)\s+(.*)$')  # Match headings like "1. Introduction"
    prev_doctop = None
    min_gap = 15  # Minimum gap between text blocks

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words(
                x_tolerance=3,
                y_tolerance=3,
                extra_attrs=["fontname", "size", "doctop"]
            )

            current_block = []
            for word in words:
                is_bold = 'Bold' in word['fontname']  # Check for bold text
                is_large = word['size'] > 12  # Check for large font
                
                if (is_bold or is_large) and heading_pattern.match(word['text']):
                    if current_block:
                        sections[current_section].append(" ".join(current_block))
                        current_block = []
                    current_section = word['text']
                else:
                    if prev_doctop and (word['doctop'] - prev_doctop > min_gap):
                        if current_block:
                            sections[current_section].append(" ".join(current_block))
                            current_block = []
                    current_block.append(word['text'])
                    prev_doctop = word['doctop']

            if current_block:
                sections[current_section].append(" ".join(current_block))

    return {
        section: "\n".join(paragraphs).strip()
        for section, paragraphs in sections.items()
        if paragraphs
    }

@app.route('/receive-text', methods=['POST'])
def receive_text():
    data = request.json
    highlighted_text = data.get('highlightedTextContent', '').strip()

    if not highlighted_text:
        return jsonify({"error": "No text received"}), 400

    # Process the text and PDF together
    pdf_sections = extract_sections(get_pdf_path())
    combined_response = {
        "Highlighted Text": highlighted_text,
        **pdf_sections
    }

    return jsonify({"sections": combined_response})

if __name__ == '__main__':
    app.run(debug=True)