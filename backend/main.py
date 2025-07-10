from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pymongo import MongoClient
import os
import socketio
from fastapi.responses import Response
from fastapi.routing import APIRoute

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup (assume local for MVP)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["avora_db"]
messages_collection = db["messages"]

# Socket.io server setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio)

@sio.event
def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
def message(sid, data):
    print(f"Message from {sid}: {data}")
    # Broadcast to all clients (for MVP)
    sio.emit('message', data)

# Mount FastAPI and Socket.io together
class SocketIORouter(APIRoute):
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()
        async def custom_route_handler(request: Request):
            if request.scope["type"] == "http":
                return await original_route_handler(request)
            else:
                return await sio_app(request.scope, request.receive, request.send)
        return custom_route_handler

# Replace FastAPI's router with one that can handle Socket.io
app.router.route_class = SocketIORouter

@app.get("/")
def read_root():
    return {"message": "Avora backend is running"}

@app.get("/personas", response_model=List[str])
def get_personas():
    # Placeholder: return a static list of personas
    return ["Morgan Freeman", "Shrek", "Tony Stark", "Deadpool"]

@app.get("/chat/history")
def get_chat_history(user_id: str, peer_id: str):
    # Fetch messages between user_id and peer_id
    query = {"$or": [
        {"sender": user_id, "receiver": peer_id},
        {"sender": peer_id, "receiver": user_id}
    ]}
    messages = list(messages_collection.find(query, {"_id": 0}))
    return {"messages": messages}

@app.post("/chat/send")
def send_message(data: dict):
    # Store a new message
    message = {
        "sender": data.get("sender"),
        "receiver": data.get("receiver"),
        "text": data.get("text"),
        "persona": data.get("persona"),
        "timestamp": data.get("timestamp")
    }
    messages_collection.insert_one(message)
    return {"status": "ok"}

@app.post("/chat/transform")
def transform_message(request: Request):
    # Placeholder: echo back the message
    return {"transformed": "[Persona style] "} 