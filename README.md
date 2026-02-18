# HATEOAS Blog Frontend

Frontend проект на React + TypeScript с архитектурой HATEOAS (Hypermedia as the Engine of Application State) и HAL+JSON.

**Демо:** [https://hateoas.vercel.app/](https://hateoas.vercel.app/)

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
    config.ts             # Конфигурация API (base URL и т.д.)
    types.ts              # TS интерфейсы для HAL-ресурсов
    hateoas-client.ts     # Универсальный клиент для работы с HATEOAS ссылками
    postsApi.ts           # RTK Query endpoints для постов
    __tests__/            # Тесты HateoasClient и API
  features/
    posts/
      components/         # Компоненты постов (PostCard, PostEditor, PostList)
      hooks/              # Хуки (useHateoasLinks, usePostActions, usePostStateMachine)
      pages/              # Страницы (PostsPage, PostDetailPage)
  shared/
    components/           # Общие компоненты (HateoasButton)
    hal/                  # HAL-парсер: типы, парсинг _links/_embedded, URI Template (см. shared/hal/README.md)
    utils/                # Утилиты (errorFormatter, linkParser)
  store/
    store.ts              # Redux store
  test/
    setup.ts              # Настройка тестового окружения
```

## Установка и запуск

1. В корневой директории проекта установите зависимости:
```bash
npm install
```

### Запуск обоих сервисов одновременно (рекомендуется)

Для полноценной работы приложения запустите оба сервиса одной командой:
```bash
npm run dev
```

Эта команда запустит:
- **Server** на `http://localhost:3000/api`
- **Frontend** на `http://localhost:3001`

### Запуск отдельных сервисов

Если нужно запустить только один из сервисов:

**Только Frontend:**
```bash
npm run dev:client
```

**Только Server:**
```bash
npm run dev:server
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
      "type": "PUT"
    },
    "delete": {
      "href": "/api/posts/1",
      "rel": "delete",
      "type": "DELETE"
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

1. **HateoasClient** — универсальный клиент для работы со ссылками
2. **HAL parser** (`shared/hal/`) — типы и функции для чтения `_links`/`_embedded`, раскрытие URI Template (RFC 6570), type guards для HAL-ресурсов
3. **Условный рендеринг** — UI-кнопки отображаются только если есть соответствующая ссылка в `_links`
4. **State machine** — опциональная проверка консистентности состояний постов
5. **Типобезопасность** — полная типизация всех HAL-ресурсов

## Тестирование

Проект включает тесты для HATEOAS-логики:

- **HateoasClient** (`api/__tests__/`) — работа со ссылками, парсинг шаблонных ссылок, выполнение действий
- **HAL parser** (`shared/hal/__tests__/`) — парсинг `_links`/`_embedded`, URI Template, type guards

## Лицензия

MIT
