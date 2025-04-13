"""
    Downloads a PDF from an arXiv link and saves it locally.

    Args:
        arxiv_url (str): The URL of the arXiv paper (e.g., https://arxiv.org/abs/1234.56789)
        save_dir (str): Directory to save the downloaded PDF (default: current directory)
    """
import requests
import os
from urllib.parse import urlparse
from pathvalidate import sanitize_filename  # install via: pip install pathvalidate

def download_arxiv_pdf(arxiv_url, save_dir="PromptEngineering/RAG Model"):
    os.makedirs(save_dir, exist_ok=True)
    
    # Extract identifier or fallback to using full URL
    try:
        arxiv_id = arxiv_url.rstrip('/').split('/')[-1]
        filename = "Research.pdf"
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
        
        response = requests.get(pdf_url, allow_redirects=True)
        response.raise_for_status()

        full_path = os.path.join(save_dir, filename)
        with open(full_path, 'wb') as f:
            f.write(response.content)

        print(f"✅ Downloaded: {filename}")
        return full_path
    except Exception as e:
        print(f"❌ Failed to download from {arxiv_url} - {e}")
        return None
