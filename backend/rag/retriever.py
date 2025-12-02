# backend/rag/retriever.py
from langchain.chains import RetrievalQA
from langchain_chroma import Chroma
from core.config import llm, embeddings, CHROMA_DIR
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))
def query_with_retry(user_id: str, question: str, filename_filter: str | None = None):
    user_dir = CHROMA_DIR / user_id
    if not user_dir.exists():
        raise ValueError("No documents uploaded yet")

    #  Create  or load per-user vectorstore
    vectorstore = Chroma(
        persist_directory=str(user_dir),
        embedding_function=embeddings,
        collection_name=f"user_{user_id}"  # ← CRITICAL: Unique collection per user
    )

    #search top 4 realvent chanks
    search_kwargs = {"k": 4}
    if filename_filter:
        search_kwargs["filter"] = {"source": filename_filter}

    retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
    return qa.invoke({"query": question})