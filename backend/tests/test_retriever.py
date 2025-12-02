# backend/tests/test_retriever.py
import sys
import os
from pathlib import Path
from tenacity import RetryError
import shutil
import pytest

# Make imports work when running pytest from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from rag.retriever import query_with_retry
from rag.ingest import ingest_document
from core.config import embeddings, CHROMA_DIR, UPLOAD_DIR, METADATA_FILE
import json

# === TEST CONSTANTS ===
TEST_USER_ID = "test_user_123"
TEST_FILE_NAME = "machine_learning_basics.txt"

@pytest.fixture(scope="module")
def setup_test_data():
    """Setup: Create test vectorstore before all tests"""
    print("\n🔧 Setting up test data...")
    
    # Create test file content
    content = (
        "Machine learning is a subset of artificial intelligence.\n"
        "Deep learning is a type of machine learning using neural networks.\n"
        "Python, PyTorch, and TensorFlow are popular ML frameworks.\n"
        "Overfitting occurs when a model learns noise instead of patterns.\n"
        "@filename filtering works great in this app!"
    )
    
    # Create temporary test file
    test_file_path = UPLOAD_DIR / f"{TEST_USER_ID}_{TEST_FILE_NAME}"
    test_file_path.write_text(content, encoding="utf-8")
    
    # Use the real ingest_document function
    ingest_document(str(test_file_path), TEST_USER_ID, TEST_FILE_NAME)
    
    print(f" Test vectorstore created for user {TEST_USER_ID}")
    
    # Yield control to tests
    yield
    
    # Teardown: Clean up after all tests
    print("\n🧹 Cleaning up test data...")
    
    # Remove test user's Chroma directory
    test_user_dir = CHROMA_DIR / TEST_USER_ID
    if test_user_dir.exists():
        shutil.rmtree(test_user_dir)
        print(f" Removed {test_user_dir}")
    
    # Remove test file from uploads
    test_file = UPLOAD_DIR / f"{TEST_USER_ID}_{TEST_FILE_NAME}"
    if test_file.exists():
        test_file.unlink()
        print(f" Removed {test_file}")
    
    # Clean up metadata file entries for test user
    if METADATA_FILE.exists():
        try:
            metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
            # Remove all entries for test user
            metadata = {k: v for k, v in metadata.items() if v.get("user_id") != TEST_USER_ID}
            METADATA_FILE.write_text(json.dumps(metadata, indent=2))
            print(f" Cleaned metadata for {TEST_USER_ID}")
        except Exception as e:
            print(f"⚠️  Metadata cleanup warning: {e}")
    
    print(" Test cleanup complete")

# === ACTUAL TESTS ===
def test_retriever_returns_relevant_answer(setup_test_data):
    """Test basic retrieval without filename filtering"""
    result = query_with_retry(TEST_USER_ID, "What is deep learning?")
    
    assert isinstance(result, dict)
    assert "result" in result
    assert "deep learning" in result["result"].lower() or "neural network" in result["result"].lower()
    assert len(result["source_documents"]) > 0

def test_filename_filtering_works(setup_test_data):
    """Test retrieval with @filename syntax"""
    result = query_with_retry(TEST_USER_ID, "What is overfitting?", filename_filter=TEST_FILE_NAME)
    
    assert len(result["source_documents"]) > 0
    sources = [doc.metadata["source"] for doc in result["source_documents"]]
    assert TEST_FILE_NAME in sources
    assert "overfitting" in result["result"].lower() or "noise" in result["result"].lower()

def test_no_documents_case():
    """Test that querying a user with no documents raises appropriate error"""
    empty_user = "empty_user_999"
    
    # Clean up if exists
    empty_user_dir = CHROMA_DIR / empty_user
    if empty_user_dir.exists():
        shutil.rmtree(empty_user_dir)
    
    try:
        query_with_retry(empty_user, "anything")
        assert False, "Should have raised RetryError"
    except RetryError as e:
        original = e.last_attempt.exception()
        assert isinstance(original, ValueError)
        assert "No documents" in str(original)

def test_query_with_multiple_chunks(setup_test_data):
    """Test that retriever returns multiple relevant chunks"""
    result = query_with_retry(TEST_USER_ID, "Tell me about machine learning frameworks")
    
    assert len(result["source_documents"]) > 0
    # Should mention frameworks or Python
    answer_lower = result["result"].lower()
    assert any(term in answer_lower for term in ["python", "pytorch", "tensorflow", "framework"])