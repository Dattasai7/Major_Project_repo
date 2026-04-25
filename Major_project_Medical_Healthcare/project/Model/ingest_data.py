import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader

# 1. Load your medical text data
# (Place your medical.txt or disease_info.txt in the same folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
loader = TextLoader(os.path.join(BASE_DIR, "medical_knowledge.txt"))
documents = loader.load()

# 2. Split text into small chunks so the AI can read them easily
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
docs = text_splitter.split_documents(documents)

# 3. Create Embeddings (Turning words into numbers)
# Using a small, fast model that runs locally
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# 4. Create and Save the FAISS Index
print("Building FAISS index... please wait.")
vector_db = FAISS.from_documents(docs, embeddings)
vector_db.save_local(os.path.join(BASE_DIR, "faiss_medical_index"))
print("Successfully saved to 'faiss_medical_index' folder!")