from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(max_length=20)
    language: str = Field(default="en", pattern=r"^(en|my|th)$")


class StreamChunk(BaseModel):
    token: str
    conversation_id: str


class StreamDone(BaseModel):
    conversation_id: str
    demos_remaining: int
