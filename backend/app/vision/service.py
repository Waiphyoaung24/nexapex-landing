from __future__ import annotations

import io
import time
from typing import TYPE_CHECKING

from PIL import Image

from app.vision.schemas import BusinessSuggestion, Detection

if TYPE_CHECKING:
    from ultralytics import YOLO

INDUSTRY_CLUSTERS: dict[str, dict] = {
    "retail": {
        "classes": {
            "bottle", "cup", "bowl", "vase", "book", "cell phone",
            "laptop", "keyboard", "mouse", "remote", "handbag",
            "backpack", "suitcase",
        },
        "title": "Smart Inventory & Retail Analytics",
        "pitch": (
            "We detected {count} countable products in this image. "
            "Imagine this trained on YOUR specific inventory \u2014 automatic stock "
            "counting, misplaced item alerts, and shelf compliance monitoring."
        ),
        "cta_text": "See how we helped a retail chain reduce stockouts by 34%",
    },
    "manufacturing": {
        "classes": {
            "person", "truck", "car", "bicycle", "motorcycle", "bus", "train",
        },
        "title": "Workplace Safety & Operations",
        "pitch": (
            "We identified {count} people and vehicles in this scene. "
            "A custom model could monitor PPE compliance, restricted zone "
            "violations, and vehicle-pedestrian proximity in real-time."
        ),
        "cta_text": "Learn how AI-powered safety monitoring works",
    },
    "food": {
        "classes": {
            "pizza", "cake", "sandwich", "banana", "apple", "orange",
            "donut", "hot dog", "carrot", "broccoli", "bowl", "cup",
            "wine glass", "fork", "knife", "spoon",
        },
        "title": "F&B Quality & Kitchen Intelligence",
        "pitch": (
            "We spotted {count} food items and kitchen objects. "
            "Custom vision can automate portion control, ingredient "
            "verification, and hygiene compliance for your kitchen."
        ),
        "cta_text": "Discover AI solutions for food service",
    },
    "agriculture": {
        "classes": {
            "cow", "sheep", "horse", "bird", "cat", "dog", "potted plant",
        },
        "title": "Smart Agriculture & Livestock",
        "pitch": (
            "We detected {count} animals/plants in this image. "
            "Trained on your farm, this becomes automated livestock counting, "
            "health monitoring, and crop assessment."
        ),
        "cta_text": "Explore precision agriculture solutions",
    },
}


def match_industry(class_names: list[str]) -> BusinessSuggestion:
    """Match detected classes to the best-fit industry cluster."""
    if not class_names:
        return BusinessSuggestion(
            industry="general",
            title="AI-Powered Object Detection",
            pitch="No objects detected at the current confidence level. Try a different image or lower the confidence threshold.",
            cta_text="Talk to us about custom AI solutions",
        )

    unique = set(class_names)
    best_cluster = ""
    best_count = 0

    for cluster_name, cluster in INDUSTRY_CLUSTERS.items():
        overlap = unique & cluster["classes"]
        if len(overlap) > best_count:
            best_count = len(overlap)
            best_cluster = cluster_name

    if best_count >= 2 and best_cluster:
        cluster = INDUSTRY_CLUSTERS[best_cluster]
        matched_count = sum(1 for c in class_names if c in cluster["classes"])
        return BusinessSuggestion(
            industry=best_cluster,
            title=cluster["title"],
            pitch=cluster["pitch"].format(count=matched_count),
            cta_text=cluster["cta_text"],
        )

    return BusinessSuggestion(
        industry="general",
        title="Custom AI Object Detection",
        pitch=(
            f"We detected {len(class_names)} objects across "
            f"{len(unique)} categories. Imagine this trained "
            f"specifically on your products."
        ),
        cta_text="Talk to us about custom AI solutions",
    )


def run_inference(
    model: YOLO, image_bytes: bytes, confidence: float = 0.25
) -> dict:
    """Run YOLO26n inference and return structured results.

    Follows the ultralytics Python API from docs/yolo-reference-tutorial/tutorial.ipynb:
      model = YOLO("yolo26n.pt")
      results = model.predict(source=img, conf=0.25, save=False, verbose=False)
      xyxy = results[0].boxes.xyxy.cpu().numpy()
      conf = results[0].boxes.conf.cpu().numpy()
      cls = results[0].boxes.cls.cpu().numpy().astype(int)
    """
    start = time.perf_counter()
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size

    results = model.predict(source=img, conf=confidence, save=False, verbose=False)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    detections: list[Detection] = []
    class_names: list[str] = []

    if results and len(results) > 0:
        result = results[0]
        if result.boxes is not None and len(result.boxes) > 0:
            xyxy = result.boxes.xyxy.cpu().numpy()
            conf_scores = result.boxes.conf.cpu().numpy()
            cls_ids = result.boxes.cls.cpu().numpy().astype(int)

            for i in range(len(xyxy)):
                x1, y1, x2, y2 = xyxy[i]
                cls_name = model.names[int(cls_ids[i])]
                area_pct = ((x2 - x1) * (y2 - y1)) / (w * h) * 100

                detections.append(
                    Detection(
                        class_name=cls_name,
                        confidence=round(float(conf_scores[i]), 3),
                        bbox=[round(float(v), 1) for v in [x1, y1, x2, y2]],
                        area_percentage=round(float(area_pct), 1),
                    )
                )
                class_names.append(cls_name)

    unique_classes = len(set(class_names))
    suggestion = match_industry(class_names)

    return {
        "detections": detections,
        "total_objects": len(detections),
        "unique_classes": unique_classes,
        "processing_time_ms": elapsed_ms,
        "image_dimensions": {"width": w, "height": h},
        "suggestion": suggestion,
    }
