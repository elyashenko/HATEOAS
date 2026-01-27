# HATEOAS Blog Frontend

Frontend проект на React + TypeScript с архитектурой HATEOAS (Hypermedia as the Engine of Application State) и HAL+JSON.

## Описание

Этот проект демонстрирует, как фронтенд может быть максимально отвязан от жёстко закодированных endpoint'ов и управляться гипермедиа-ссылками, которые возвращает сервер.

## Технологии

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Redux Toolkit + RTK Query** - управление состоянием и API запросы
- **React Router** - маршрутизация
- **Tailwind CSS** - стилизация
- **Vite** - сборщик
- **Vitest** - тестирование

## Структура проекта

```
src/
  api/
    types.ts              # TS интерфейсы для HAL-ресурсов
    hateoas-client.ts     # универсальный клиент для работы с HATEOAS ссылками
    postsApi.ts           # RTK Query endpoints для постов
  features/
    posts/
      components/         # Компоненты постов
      hooks/              # Хуки для работы с постами
      pages/              # Страницы приложения
  shared/
    components/           # Общие компоненты
    utils/                # Утилиты
  store/
    store.ts              # Redux store
```

## Установка и запуск

### Server (Fastify + TypeScript)

1. Перейдите в директорию server:
```bash
cd server
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер:
```bash
npm run start:dev
```

Сервер будет доступен на `http://localhost:3000/api`

### Frontend (React)

1. В корневой директории проекта установите зависимости:
```bash
npm install
```

2. Запустите dev сервер:
```bash
npm run dev
```

Frontend будет доступен на `http://localhost:3001`

### Запуск обоих сервисов

Для полноценной работы приложения необходимо запустить оба сервиса одновременно:

**Терминал 1 (Server):**
```bash
cd server
npm install
npm run start:dev
```

**Терминал 2 (Frontend):**
```bash
npm install
npm run dev
```

### Тесты

Запуск тестов фронтенда:
```bash
npm test
```

## Архитектура HATEOAS

### Основные принципы

1. **Клиент не знает URI** - все ссылки приходят с сервера в поле `_links`
2. **Действия определяются ссылками** - какие действия доступны, клиент узнаёт из `_links`
3. **Состояние управляется сервером** - переходы между состояниями определяются наличием соответствующих ссылок

### Пример HAL+JSON ресурса

```json
{
  "id": 1,
  "title": "Как использовать HATEOAS",
  "content": "...",
  "author": "Ivan Petrov",
  "status": "DRAFT",
  "createdAt": "2025-01-20T10:00:00Z",
  "publishedAt": null,
  "_links": {
    "self": {
      "href": "/api/posts/1",
      "type": "application/hal+json"
    },
    "publish": {
      "href": "/api/posts/1/publish",
      "rel": "publish",
      "method": "POST"
    },
    "update": {
      "href": "/api/posts/1",
      "rel": "update",
      "method": "PUT"
    },
    "delete": {
      "href": "/api/posts/1",
      "rel": "delete",
      "method": "DELETE"
    }
  }
}
```

### Workflow постов

- **DRAFT** → может быть опубликован (`publish`), отредактирован (`update`), удалён (`delete`)
- **PUBLISHED** → может быть архивирован (`archive`), отредактирован (`update`)
- **ARCHIVED** → может быть переопубликован (`republish`), удалён (`delete`)

## API Endpoints

Сервер реализован на Fastify + TypeScript и доступен на `http://localhost:3000/api` с поддержкой HAL+JSON формата.

### Основные endpoints:

- `GET /api/posts` - список постов (с пагинацией, query: `page`, `size`)
- `GET /api/posts/:id` - получить пост
- `POST /api/posts` - создать новый пост (статус DRAFT)
- `PUT /api/posts/:id` - обновить пост (если доступно)
- `POST /api/posts/:id/publish` - опубликовать пост (если доступно, только для DRAFT)
- `POST /api/posts/:id/archive` - архивировать пост (если доступно, только для PUBLISHED)
- `POST /api/posts/:id/republish` - переопубликовать пост (только для ARCHIVED)
- `DELETE /api/posts/:id` - удалить пост (если доступно)

Подробнее о server API см. [server/README.md](./server/README.md)

## Особенности реализации

1. **HateoasClient** - универсальный клиент для работы со ссылками
2. **Условный рендеринг** - UI кнопки отображаются только если есть соответствующая ссылка в `_links`
3. **State machine** - опциональная проверка консистентности состояний
4. **Типобезопасность** - полная типизация всех HAL ресурсов

## Тестирование

Проект включает базовые тесты для HATEOAS логики:

- Тесты для `HateoasClient`
- Проверка работы со ссылками
- Проверка парсинга шаблонных ссылок
- Проверка выполнения действий

## Лицензия

MIT
