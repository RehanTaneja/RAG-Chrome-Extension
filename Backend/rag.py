# rag.py
import logging
import google.generativeai as genai
import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
from chromadb.errors import NotFoundError
from google.api_core import retry

from data_extraction import extract_sections
import os

API_KEY = os.environ["GEMINI_API_KEY"]

# ─── Configuration & Globals ───────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
genai.configure(api_key=API_KEY)

chroma_client = chromadb.Client()
db = None


# ─── Embedding Function ────────────────────────────────────────────────────────
class GeminiEmbeddingFunction(EmbeddingFunction):
    document_mode = True

    def __call__(self, input: Documents) -> Embeddings:
        task = "retrieval_document" if self.document_mode else "retrieval_query"
        retry_policy = {"retry": retry.Retry(predicate=retry.if_transient_error)}
        resp = genai.embed_content(
            model="models/text-embedding-004",
            content=input,
            task_type=task,
            request_options=retry_policy,
        )
        return resp["embedding"]


# ─── Document Creation ─────────────────────────────────────────────────────────
def create_documents_from_dict(topic_text_dict: dict) -> list[str]:
    return [f"{topic}\n{text}" for topic, text in topic_text_dict.items()]


# ─── Model Loading / Reloading ─────────────────────────────────────────────────
def reload_rag_model(pdf_path: str = "Research.pdf") -> None:
    """
    Build or rebuild the Chroma collection from scratch.
    """
    global db
    try:
        chroma_client.delete_collection("googlecardb")
        logging.info("Deleted existing collection.")
    except NotFoundError:
        logging.info("No existing collection to delete; continuing.")

    db = chroma_client.get_or_create_collection(
        name="googlecardb",
        embedding_function=GeminiEmbeddingFunction()
    )

    # Extract text sections & ingest
    topic_text_dict = extract_sections(pdf_path)
    docs = create_documents_from_dict(topic_text_dict)
    db.add(documents=docs, ids=[str(i) for i in range(len(docs))])
    logging.info(f"✅ RAG model reset from '{pdf_path}', {len(docs)} docs loaded.")


# ─── Definition Lookup ─────────────────────────────────────────────────────────
def get_contextual_definition(highlighted_text: str) -> str:
    """
    Given a term or phrase, look up the most relevant passage
    and return a structured, contextual definition.
    """
    global db
    if db is None:
        reload_rag_model()

    query = highlighted_text.strip()
    results = db.query(query_texts=[query], n_results=1)
    [[passage]] = results["documents"]

    prompt = (
        f"Explain the specific meaning and context of '{query}' based "
        f"EXCLUSIVELY on this passage. Use two headings: "
        "1. Operational Context\n2. Other Use-cases\n\n"
        + passage.replace("\n", " ")
    )
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    return response.text.strip()


# ─── Chat Interface ───────────────────────────────────────────────────────────
def chat_with_doc(user_question: str) -> str:
    """
    Answer a user’s free-form question using the most relevant passage.
    """
    global db
    if db is None:
        reload_rag_model()

    query = user_question.strip()
    results = db.query(query_texts=[query], n_results=1)
    [[passage]] = results["documents"]

    prompt = (
        "You are a helpful assistant. Answer based only on this passage: "
        + passage.replace("\n", " ")
        + f"\n\nQuestion: {query}\nAnswer:"
    )
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    return response.text.strip()
