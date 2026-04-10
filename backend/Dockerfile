FROM python:3.11-slim

WORKDIR /app

# System deps for pytesseract/opencv + build tools for llama-cpp-python
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    curl \
    gcc \
    g++ \
    cmake \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir ".[ai,email,local-llm]" \
    --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu \
    && pip cache purge 2>/dev/null; true

COPY . .
RUN chmod +x entrypoint.sh

EXPOSE 8054
CMD ["./entrypoint.sh"]
