FROM node:20-slim AS web

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY --from=web /app/dist /app/dist
COPY --from=web /app/public /app/public
COPY --from=web /app/bot.py /app/bot.py

ENV PORT=7860
EXPOSE 7860

CMD ["python", "bot.py"]
