FROM python:3.11-slim

WORKDIR /app

# Instala dependências do sistema necessárias para Pillow/PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Hugging Face Spaces usa a porta 7860 por padrão
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
