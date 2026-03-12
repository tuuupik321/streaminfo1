---
title: bot-app
emoji: "🤖"
colorFrom: blue
colorTo: indigo
sdk: docker
app_file: bot.py
pinned: false
---

## StreamFly Bot

StreamFly Bot — умный помощник для стримеров и авторов контента, который объединяет аналитику, мониторинг и управление в одном месте.

### Что умеет бот

- Показывает ключевую статистику по стримам.
- Помогает отслеживать активность и динамику аудитории.
- Собирает важные события в удобный дашборд.
- Поддерживает админ-панель для управления и контроля.
- Работает как веб-интерфейс и Mini App.

StreamFly Bot создан, чтобы упростить рутину, ускорить принятие решений и помочь развивать канал на основе данных.

## Android Studio

В проект добавлена Android-обёртка через Capacitor. Это даёт нам полноценную папку [`android`](C:/Users/ratka/Desktop/bot/android) для Android Studio без переписывания фронтенда на Kotlin.

Что важно сейчас:

- Android-приложение открывает живую продовую версию на [streamfly-bot.onrender.com](https://streamfly-bot.onrender.com).
- Основной фронтенд остаётся в [`src`](C:/Users/ratka/Desktop/bot/src), а Android-часть синхронизируется из этого репозитория.

Базовые команды:

```bash
npm run android:build
npm run android:open
```

Поток работы:

1. Меняем веб-приложение.
2. Запускаем `npm run android:build`.
3. Открываем проект в Android Studio через `npm run android:open`.
