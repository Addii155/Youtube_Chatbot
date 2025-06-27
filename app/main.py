from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from fastapi.middleware.cors import CORSMiddleware
from deep_translator import GoogleTranslator
from langdetect import detect
from datetime import datetime
import os
import uuid
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

video_collection_map = {}

embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

genai_model = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.3,
    api_key=os.getenv("GOOGLE_API_KEY")
)

prompt_template = PromptTemplate.from_template("""
You are an intelligent and helpful assistant designed to answer questions based on a YouTube video transcript.
Use the provided context to generate a clear, accurate, and concise answer.

---------------------
Transcript Context:
{context}
---------------------

Question:
{question}

Instructions:
- Base your answer only on the above transcript context.
- Be precise and informative.
- If the answer cannot be determined from the context, respond with:
  "The transcript does not contain enough information to answer that question."

Answer:
""")

parser = StrOutputParser()

def get_transcript(video_id: str):
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_text = " ".join(item['text'] for item in transcript_list)
        detected_lang = detect(transcript_text)
        logger.info(f"Transcript language detected: {detected_lang}")

        if detected_lang != "en":
            translated = GoogleTranslator(source='auto', target='en').translate(transcript_text)
            return [translated]
        return [transcript_text]

    except TranscriptsDisabled:
        raise HTTPException(status_code=404, detail="Transcripts are disabled for this video.")
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No transcript found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcript error: {str(e)}")

def get_splitter(transcript: list):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    return splitter.create_documents(transcript)

class SubmitRequest(BaseModel):
    video_id: str

class AskRequest(BaseModel):
    video_id: str
    question: str

@app.post("/submit")
async def submit_video(req: SubmitRequest):
    try:
        transcript = get_transcript(req.video_id)
        chunks = get_splitter(transcript)

        collection_name = f"vid_{req.video_id}"
        Chroma.from_documents(
            documents=chunks,
            embedding=embedding,
            collection_name=collection_name,
            persist_directory="chroma_db"
        )

        video_collection_map[req.video_id] = {
            "collection_name": collection_name,
        }

        return {"message": "Transcript processed and stored successfully."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(req: AskRequest):
    try:
        if req.video_id not in video_collection_map:
            raise HTTPException(status_code=400, detail="Video not submitted. Please submit first.")

        collection_name = video_collection_map[req.video_id]['collection_name']
        detected_lang = detect(req.question)

        translated_question = (
            GoogleTranslator(source='auto', target='en').translate(req.question)
            if detected_lang != "en"
            else req.question
        )

        vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=embedding,
            persist_directory="chroma_db"
        )
        retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
        docs = retriever.invoke(translated_question)
        context = "\n".join(doc.page_content for doc in docs)

        chain = prompt_template | genai_model | parser
        english_answer = chain.invoke({"context": context, "question": translated_question})

        final_answer = (
            GoogleTranslator(source='en', target=detected_lang).translate(english_answer)
            if detected_lang != "en"
            else english_answer
        )

        return {"answer": final_answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/getcomment')
async def get_comments_endpoint(req: SubmitRequest):
    try:
        from app.api import get_comments
        comments = get_comments(req.video_id)
        return {"comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
