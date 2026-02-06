# Инструкция по деплою на Vercel

## Проблема: 404 ошибки при обращении к API

Если при деплое на Vercel вы получаете 404 ошибки при обращении к ресурсам API, проверьте следующее:

## Решение

### 1. Конфигурация `vercel.json`

Убедитесь, что в `vercel.json` правильно настроены `builds` и `routes`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "builds": [
    {
      "src": "api/[...path].ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/[...path]"
    },
    {
      "src": "/((?!api/).*)",
      "dest": "/index.html"
    }
  ]
}
```

**Важно:**
- `builds` указывает Vercel, какой файл использовать как serverless функцию
- `routes` маппит все запросы `/api/*` на catch-all handler `api/[...path].ts`
- Порядок routes важен - сначала API, потом фронтенд

### 2. Структура API handler

Handler в `api/[...path].ts` должен:
- Экспортировать default функцию с сигнатурой `(req: VercelRequest, res: VercelResponse) => Promise<void>`
- Инициализировать Fastify приложение один раз (кэширование)
- Вызывать `await app.ready()` перед использованием `app.inject()`
- Использовать `app.inject()` для обработки запросов через Fastify

### 3. Fastify приложение

В `server/main.ts`:
- Функция `buildApp()` создает и настраивает Fastify
- **НЕ вызывайте** `app.listen()` в serverless окружении
- Убедитесь, что все роуты регистрируются с префиксом `/api`

### 4. Проверка деплоя

После деплоя проверьте:

1. **Логи Vercel:**
   - Зайдите в Dashboard → Functions → Logs
   - Проверьте, что handler вызывается при запросах к `/api/*`
   - Ищите ошибки инициализации Fastify

2. **Тестовые запросы:**
   ```bash
   # Проверка health endpoint (если есть)
   curl https://your-project.vercel.app/api/posts
   
   # Проверка конкретного ресурса
   curl https://your-project.vercel.app/api/posts/1
   ```

3. **Что должно быть в логах:**
   ```
   === Vercel Handler Called ===
   Initializing Fastify app...
   Fastify app initialized and ready
   Vercel handler: { "method": "GET", "url": "/api/posts", ... }
   Response status: 200 for GET /api/posts
   ```

### 5. Частые проблемы

#### Проблема: HTML 404 вместо JSON
**Причина:** Vercel не маппит запросы на API handler
**Решение:** Проверьте `vercel.json` - routes должны быть настроены правильно

#### Проблема: 500 ошибка при инициализации
**Причина:** Ошибка при создании Fastify приложения
**Решение:** Проверьте логи Vercel, убедитесь что все зависимости установлены

#### Проблема: 404 от Fastify (не от Vercel)
**Причина:** Роут не зарегистрирован в Fastify или путь неправильный
**Решение:** Проверьте логи - должен быть виден URL, который передается в `app.inject()`

### 6. Локальная проверка

Для локальной проверки используйте Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Это запустит локальный сервер, который имитирует поведение Vercel.

## Дополнительные ресурсы

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Routing](https://vercel.com/docs/project-configuration#routes)
- [Fastify on Vercel](https://www.fastify.io/docs/latest/Guides/Serverless/)
