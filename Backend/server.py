# server.py
import os
import re
import logging
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS

from rag import (
    reload_rag_model,
    get_contextual_definition,
    chat_with_doc,
)

# ─── Flask Setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # allow all origins; tighten if needed
logging.basicConfig(level=logging.INFO)

# ─── Globals to track current PDF ──────────────────────────────────────────────
current_pdf_url = None
current_pdf_path = None

# ─── Helpers ───────────────────────────────────────────────────────────────────
def download_pdf(url: str) -> str:
    """
    Download a PDF from `url` into ./pdfs/ with a safe filename.
    Returns the local filepath.
    """
    os.makedirs("pdfs", exist_ok=True)
    safe_name = re.sub(r'\W+', '_', url)[:50] + ".pdf"
    local_path = os.path.join("pdfs", safe_name)

    # If we've already downloaded it, skip the re-download
    if os.path.exists(local_path):
        return local_path

    logging.info(f"Downloading PDF from {url}")
    resp = requests.get(url)
    resp.raise_for_status()
    with open(local_path, "wb") as f:
        f.write(resp.content)
    return local_path

def ensure_pdf_loaded(pdf_url: str):
    """
    If `pdf_url` is new, download it and reload the RAG model.
    """
    global current_pdf_url, current_pdf_path
    if pdf_url != current_pdf_url:
        path = download_pdf(pdf_url)
        reload_rag_model(path)
        current_pdf_url = pdf_url
        current_pdf_path = path
        logging.info(f"RAG model reloaded from {pdf_url}")

# ─── Endpoints ─────────────────────────────────────────────────────────────────
@app.route("/define", methods=["POST"])
def define():
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    pdf_url = data.get("pdfUrl", "").strip()

    if not pdf_url:
        return jsonify({"error": "Missing 'pdfUrl'"}), 400
    if not text:
        return jsonify({"error": "Missing 'text'"}), 400

    ensure_pdf_loaded(pdf_url)
    result = get_contextual_definition(text)
    return jsonify({"result": result})


@app.route("/synopsis", methods=["POST"])
def synopsis():
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    pdf_url = data.get("pdfUrl", "").strip()

    if not pdf_url:
        return jsonify({"error": "Missing 'pdfUrl'"}), 400
    if not text:
        return jsonify({"error": "Missing 'text'"}), 400

    ensure_pdf_loaded(pdf_url)
    # repurpose chat_with_doc for summaries
    prompt = f"Provide a concise synopsis of:\n\n{text}"
    result = chat_with_doc(prompt)
    return jsonify({"result": result})


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    pdf_url = data.get("pdfUrl", "").strip()

    if not pdf_url:
        return jsonify({"error": "Missing 'pdfUrl'"}), 400
    if not question:
        return jsonify({"error": "Missing 'question'"}), 400

    ensure_pdf_loaded(pdf_url)
    answer = chat_with_doc(question)
    return jsonify({"result": answer})


# ─── Error Handler ─────────────────────────────────────────────────────────────
@app.errorhandler(Exception)
def handle_all_errors(e):
    logging.exception("Unhandled exception")
    return jsonify({"error": str(e)}), 500


# ─── Run Server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # No default PDF load; will load on first request
    app.run(host="0.0.0.0", port=8000, debug=True)
