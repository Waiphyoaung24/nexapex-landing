from pydantic import BaseModel


class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: list[float]
    area_percentage: float


class BusinessSuggestion(BaseModel):
    industry: str
    title: str
    pitch: str
    cta_text: str


class VisionResponse(BaseModel):
    detections: list[Detection]
    total_objects: int
    unique_classes: int
    processing_time_ms: int
    image_dimensions: dict[str, int]
    suggestion: BusinessSuggestion
    demos_remaining: int
