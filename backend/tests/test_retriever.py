import sys
import os
from pathlib import Path
from tenacity import RetryError   # ← make sure this import is at the top

# Make imports work when running pytest from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from rag.retriever import query_with_retry
from core.config import embeddings, user_vectorstores
from langchain_community.vectorstores import Chroma
from langchain.docstore.document import Document

# === AUTO-CREATE TEST FILE + VECTORSTORE ===
TEST_USER_ID = "test_user_123"
TEST_FILE_NAME = "machine_learning_basics.txt"

# Create a tiny test document automatically
def setup_test_vectorstore():
    content = (
        "Machine learning is a subset of artificial intelligence.\n"
        "Deep learning is a type of machine learning using neural networks.\n"
        "Python, PyTorch, and TensorFlow are popular ML frameworks.\n"
        "Overfitting occurs when a model learns noise instead of patterns.\n"
        "@filename filtering works great in this app!"
    )

    doc = Document(page_content=content, metadata={"source": TEST_FILE_NAME})

    # Create in-memory vectorstore for test user
    vectorstore = Chroma.from_documents([doc], embeddings)
    user_vectorstores[TEST_USER_ID] = vectorstore

# Run setup before tests
setup_test_vectorstore()


# === ACTUAL TESTS ===
def test_retriever_returns_relevant_answer():
    result = query_with_retry(TEST_USER_ID, "What is deep learning?")

    assert isinstance(result, dict)
    assert "result" in result
    assert "deep learning" in result["result"].lower()
    assert len(result["source_documents"]) > 0


def test_filename_filtering_works():
    # This uses the @filename syntax
    result = query_with_retry(TEST_USER_ID, f"@{TEST_FILE_NAME} What is overfitting?")

    assert len(result["source_documents"]) > 0
    sources = [doc.metadata["source"] for doc in result["source_documents"]]
    assert TEST_FILE_NAME in sources
    assert "overfitting" in result["result"].lower()


def test_no_documents_case():
    empty_user = "empty_user_999"
    if empty_user in user_vectorstores:
        del user_vectorstores[empty_user]

    try:
        query_with_retry(empty_user, "anything")
        assert False, "Should have raised RetryError"
    except RetryError as e:
        original = e.last_attempt.exception()
        assert isinstance(original, ValueError)
        assert "No documents" in str(original)