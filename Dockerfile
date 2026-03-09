FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*
RUN npm ci && npm run build
RUN pip install --no-cache-dir -r requirements.txt

ENV PORT=7860
EXPOSE 7860

CMD ["python", "bot.py"]