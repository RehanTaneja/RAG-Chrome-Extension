
from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict
import pdfplumber
import re
import os

flask_file = Flask(__name__)
CORS(flask_file)  # Enable CORS to allow frontend communication

@flask_file.route('/')
def home():
    return "Welcome to the PDF extraction API. Use POST /receive-text to send your data."

def get_pdf_path_from_url(url: str) -> str:
    """
    Given a URL, extract the file system path using urlparse. 
    Raise ValueError if no URL is provided or FileNotFoundError if the file is not found.
    """
    url = url.strip()
    if not url:
        raise ValueError("No URL provided")
    
    parsed_url = urlparse(url)
    # For local files, the path from urlparse should refer to the file location.
    path = parsed_url.path
    
    if not os.path.exists(path):
        raise FileNotFoundError("PDF file not found")
    
    return path

@flask_file.route('/receive-text', methods=['POST'])
def receive_text():
    """
    Expects JSON data with keys: 
      - 'highlightedTextContent': the highlighted text from the frontend.
      - 'url': a URL pointing to the PDF for processing.
    Returns extracted PDF sections merged with highlighted text.
    """
    data = request.json
    highlighted_text = data.get('highlightedTextContent', '').strip()
    url = data.get('url', '').strip()  # URL must be provided along with the highlighted text

    if not highlighted_text:
        return jsonify({"error": "No text received"}), 400

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        actual_pdf_path = get_pdf_path_from_url(url)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except FileNotFoundError as fe:
        return jsonify({"error": str(fe)}), 404

    pdf_sections = extract_sections(actual_pdf_path)

    combined_response = {
        "Highlighted Text": highlighted_text,
        **pdf_sections
    }

    return jsonify({"sections": combined_response})

def extract_sections(pdf_path: str) -> dict:
    """
    Extracts text sections from the PDF using pdfplumber.
    It uses a simplified heading detection based on bold or large font and a heading regex.
    """
    sections = defaultdict(list)
    current_section = "Introduction"
    heading_pattern = re.compile(r'^(\d+\.\d*)\s+(.*)$')  # e.g., "1. Introduction"
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
                # Protect against missing keys using .get()
                fontname = word.get('fontname', '')
                size = word.get('size', 0)
                doctop = word.get('doctop', 0)

                is_bold = 'Bold' in fontname
                is_large = size > 12

                if (is_bold or is_large) and heading_pattern.match(word['text']):
                    if current_block:
                        sections[current_section].append(" ".join(current_block))
                        current_block = []
                    current_section = word['text']
                else:
                    if prev_doctop is not None and (doctop - prev_doctop > min_gap):
                        if current_block:
                            sections[current_section].append(" ".join(current_block))
                            current_block = []
                    current_block.append(word['text'])
                    prev_doctop = doctop

            if current_block:
                sections[current_section].append(" ".join(current_block))

    return {section: "\n".join(paragraphs).strip() 
            for section, paragraphs in sections.items() if paragraphs}

if __name__ == '__main__':
    flask_file.run(debug=True)
