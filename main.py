import os
import json
import httpx
import asyncio
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- CONFIGURATION ---
# Set this in your Render.com Environment Variables
API_KEY = os.environ.get("GEMINI_API_KEY", "") 
MODEL = "gemini-2.5-flash-preview-09-2025"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

app = FastAPI()

# Security: Allow your frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your Vercel URL later
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class LessonRequest(BaseModel):
    topic: str
    level: str

# --- AI LOGIC ---
async def fetch_ai_content(prompt: str, level: str):
    system_instruction = (
        f"You are a British Curriculum expert for {level}. "
        "Return a JSON object with: "
        "'lessonNote' (string) and 'presentation' (array of objects with 'title' and 'points')."
    )
    
    payload = {
        "contents": [{"parts": [{"text": f"Topic: {prompt}"}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {"responseMimeType": "application/json"}
    }

    async with httpx.AsyncClient() as client:
        # Retry logic for reliability
        for i in range(3):
            try:
                resp = await client.post(URL, json=payload, timeout=40.0)
                if resp.status_code == 200:
                    raw_text = resp.json()['candidates'][0]['content']['parts'][0]['text']
                    return json.loads(raw_text)
            except Exception as e:
                if i == 2: raise HTTPException(status_code=500, detail=str(e))
                await asyncio.sleep(2)

@app.post("/generate-lesson")
async def generate(request: LessonRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API Key missing on server")
    return await fetch_ai_content(request.topic, request.level)

@app.get("/")
def health_check():
    return {"status": "EduSpark API is running"}
