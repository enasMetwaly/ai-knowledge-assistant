# backend/rag/retriever.py
from langchain.chains import RetrievalQA
from core.config import llm, user_vectorstores
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))
def query_with_retry(user_id: str, question: str, filename_filter: str | None = None):
    if user_id not in user_vectorstores:
        raise ValueError("No documents")

    search_kwargs = {"k": 4}
    if filename_filter:
        search_kwargs["filter"] = {"source": filename_filter}

    retriever = user_vectorstores[user_id].as_retriever(search_kwargs=search_kwargs)
    qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, return_source_documents=True)
    result = qa.invoke({"query": question})
    return result