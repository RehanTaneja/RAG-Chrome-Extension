# server.py
import os
import re
import logging
import threading
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
CORS(app)
logging.basicConfig(level=logging.INFO)

# ─── Globals ───────────────────────────────────────────────────────────────────
current_pdf_url = None
current_pdf_path = None
model_loading = False

# ─── Helpers ───────────────────────────────────────────────────────────────────
def download_pdf(url: str, timeout: int = 15) -> str:
    os.makedirs("pdfs", exist_ok=True)
    safe_name = re.sub(r'\W+', '_', url)[:50] + ".pdf"
    local_path = os.path.join("pdfs", safe_name)
    if os.path.exists(local_path):
        return local_path
    logging.info(f"Downloading PDF from {url}")
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    with open(local_path, "wb") as f:
        f.write(resp.content)
    return local_path

def _download_and_reload(pdf_url: str):
    """Download the PDF and reload the RAG model in background."""
    global current_pdf_path, model_loading
    try:
        path = download_pdf(pdf_url)
        current_pdf_path = path
        reload_rag_model(path)
        logging.info("Background download & RAG reload complete")
    except Exception:
        logging.exception("Background download/reload failed")
    finally:
        model_loading = False

def ensure_pdf_loaded(pdf_url: str):
    """
    If this is a new PDF URL, kick off a background thread
    to download & reload the model, and immediately return.
    """
    global current_pdf_url, model_loading
    if pdf_url != current_pdf_url:
        current_pdf_url = pdf_url
        model_loading = True
        thread = threading.Thread(
            target=_download_and_reload, args=(pdf_url,), daemon=True
        )
        thread.start()
        logging.info(f"Started background download & reload for {pdf_url}")

# ─── Health Check ──────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

# ─── Endpoints ─────────────────────────────────────────────────────────────────
@app.route("/define", methods=["POST"])
def define():
    data = request.get_json() or {}
    text    = data.get("text", "").strip()
    pdf_url = data.get("pdfUrl", "").strip()
    if not pdf_url:
        return jsonify({"error": "Missing 'pdfUrl'"}), 400

    ensure_pdf_loaded(pdf_url)
    if model_loading:
        return jsonify({"error": "Model still loading, please try again"}), 202

    if not text:
        return jsonify({"error": "Missing 'text'"}), 400

    result = get_contextual_definition(text)
    return jsonify({"result": result})

@app.route("/synopsis", methods=["POST"])
def synopsis():
    data = request.get_json() or {}
    text    = data.get("text", "").strip()
    pdf_url = data.get("pdfUrl", "").strip()
    if not pdf_url:
        return jsonify({"error": "Missing 'pdfUrl'"}), 400

    ensure_pdf_loaded(pdf_url)
    if model_loading:
        return jsonify({"error": "Model still loading, please try again"}), 202

    if not text:
        return jsonify({"error": "Missing 'text'"}), 400

    prompt = f"Provide a concise synopsis of:\n\n{text}"
    result = chat_with_doc(prompt)
    return jsonify({"result": result})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    pdf_url  = data.get("pdfUrl", "").strip()
    if not pdf_url:
        return jsonify({"error": "Missing 'pdfUrl'"}), 400

    ensure_pdf_loaded(pdf_url)
    if model_loading:
        return jsonify({"error": "Model still loading, please try again"}), 202

    if not question:
        return jsonify({"error": "Missing 'question'"}), 400

    answer = chat_with_doc(question)
    return jsonify({"result": answer})

# ─── Error Handler ─────────────────────────────────────────────────────────────
@app.errorhandler(Exception)
def handle_all_errors(e):
    logging.exception("Unhandled exception")
    return jsonify({"error": str(e)}), 500

# ─── Run Server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # debug=False for safety
    app.run(host="0.0.0.0", port=8000, debug=False)
