# HATEOAS Blog Server

Server API для HATEOAS блога на Fastify с поддержкой HAL+JSON формата.

## Описание

Этот сервер реализует REST API с архитектурой HATEOAS (Hypermedia as the Engine of Application State), где клиент управляется гипермедиа-ссылками, возвращаемыми сервером.

## Технологии

- **Fastify** - быстрый и легковесный веб-фреймворк для Node.js
- **TypeScript** - типизация
- **class-validator** - валидация DTOs
- **class-transformer** - трансформация данных

## Установка и запуск

1. Установите зависимости:
```bash
cd server
npm install
```

2. Запустите dev сервер:
```bash
npm run start:dev
```

Сервер запустится на `http://localhost:3000/api`

3. Для production сборки:
```bash
npm run build
npm run start:prod
```

## API Endpoints

Все endpoints доступны по префиксу `/api`:

### Посты

- `GET /api/posts` - список постов с пагинацией
  - Query параметры: `page` (по умолчанию 1), `size` (по умолчанию 10)
- `GET /api/posts/:id` - получить пост по ID
- `POST /api/posts` - создать новый пост (статус DRAFT)
- `PATCH /api/posts/:id` - обновить пост (если доступно)
- `DELETE /api/posts/:id` - удалить пост (если доступно)
- `POST /api/posts/:id/publish` - опубликовать пост (только для DRAFT)
- `POST /api/posts/:id/archive` - архивировать пост (только для PUBLISHED)
- `POST /api/posts/:id/republish` - переопубликовать пост (только для ARCHIVED)

## Формат ответов (HAL+JSON)

Все ответы возвращаются в формате HAL+JSON с полем `_links`, содержащим доступные действия:

```json
{
  "id": 1,
  "title": "Как использовать HATEOAS",
  "content": "...",
  "author": "Иван Петров",
  "status": "DRAFT",
  "createdAt": "2025-01-20T10:00:00Z",
  "publishedAt": null,
  "_links": {
    "self": {
      "href": "/api/posts/1"
    },
    "publish": {
      "href": "/api/posts/1/publish",
      "rel": "publish",
      "type": "POST"
    },
    "update": {
      "href": "/api/posts/1",
      "rel": "update",
      "type": "PATCH"
    },
    "delete": {
      "href": "/api/posts/1",
      "rel": "delete",
      "type": "DELETE"
    }
  }
}
```

## Статусы постов

- **DRAFT** - черновик, может быть опубликован, отредактирован или удален
- **PUBLISHED** - опубликован, может быть архивирован или отредактирован
- **ARCHIVED** - архивирован, может быть переопубликован или удален

## CORS

CORS настроен для работы с фронтендом на `http://localhost:3001`.

## Хранилище данных

В текущей реализации используется in-memory хранилище. Для production рекомендуется подключить базу данных (PostgreSQL, MongoDB и т.д.).
