# Pet‑проект: Frontend на архитектуре HATEOAS (React + TS)

## Назначение

Ты — старший frontend‑архитектор. Твоя задача — спроектировать и выполнить pet‑проект на React + TypeScript с использованием архитектуры HATEOAS (Hypermedia as the Engine of Application State) и HAL+JSON. Проект должен показать, как фронтенд может быть максимально отвязан от жёстко закодированных endpoint’ов и управляться гипермедиа‑ссылками, которые возвращает сервер.

## Контекст

- Стек: React 18, TypeScript, Redux Toolkit + RTK Query.
- Формат API: REST, медиа‑тип `application/hal+json`.
- Архитектурный фокус: HATEOAS, hypermedia‑driven UI, минимизация знания о URI на клиенте.
- Цель: учебный, но технически честный пример, который можно показывать в портфолио.

## Домен

Спроектируй и реализуй pet‑проект типа CMS/блога с workflow:

- Ресурс: пост (blog post).
- Статусы: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Примеры переходов:
  - `DRAFT` → `PUBLISHED` (publish).
  - `PUBLISHED` → `ARCHIVED` (archive).
  - `ARCHIVED` → `PUBLISHED` (republish, опционально).
- Доступные действия зависят от состояния:
  - Для `DRAFT`: edit, publish, delete.
  - Для `PUBLISHED`: edit, archive.
  - Для `ARCHIVED`: republish, delete.

Критическое требование: какие действия доступны — клиент узнаёт только из HATEOAS‑ссылок в ответе API, а не из жёстко прописанной логики.

## Требования к API (HATEOAS / HAL+JSON)

1. Каждый ресурс возвращается в виде HAL‑документа:

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
         "type": "PATCH"
       },
       "delete": {
         "href": "/api/posts/1",
         "rel": "delete",
         "type": "DELETE"
       },
       "author": {
         "href": "/api/authors/ivan-petrov",
         "rel": "author",
         "type": "application/hal+json"
       },
       "comments": {
         "href": "/api/posts/1/comments",
         "rel": "comments",
         "type": "application/hal+json"
       }
     }
   }

Для коллекций используй HAL‑коллекцию с _embedded.items и ссылками пагинации (self, next, prev, first, last).

Ссылки на действия (publish, archive, delete, update) присутствуют только тогда, когда операция допустима в текущем состоянии ресурса.

По возможности используй templated links для пагинации, например: "/api/posts{?page,size}".

Backend можешь реализовать как Nest — главное, чтобы формат ответов соответствовал этим правилам.

Структура фронтенд‑проекта
src/
  api/
    types.ts              // TS интерфейсы для HAL-ресурсов
    hateoas-client.ts     // универсальный клиент для работы с HATEOAS ссылками
    postsApi.ts           // RTK Query endpoints для постов
  features/
    posts/
      components/
        PostCard.tsx
        PostEditor.tsx
        PostList.tsx
      hooks/
        useHateoasLinks.ts
        usePostActions.ts
      pages/
        PostsPage.tsx
        PostDetailPage.tsx
  shared/
    components/
      HateoasButton.tsx
    utils/
      linkParser.ts
  store/
    store.ts
Обязательные элементы
Типы (api/types.ts)
Опиши:

HateoasLink:

поля: href, rel?, type? ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string для HTTP-метода запроса), templated?, title?.

HateoasResource<T = any>:

поля: _links: Record<string, HateoasLink | HateoasLink[]>,

_embedded?: Record<string, any>,

остальные поля ресурса.

HateoasCollection<T>:

наследует HateoasResource,

_embedded?: { items: (T & HateoasResource)[] },

поля пагинации: page?, size?, totalElements?, totalPages?.

BlogPost extends HateoasResource:

id, title, content, author,

status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',

createdAt: string,

publishedAt: string | null.

LinkRelationType:

'self' | 'publish' | 'update' | 'delete' | 'archive' | 'comments' | 'author' | 'next' | 'prev' | 'first' | 'last'.

HATEOAS‑клиент (api/hateoas-client.ts)
Реализуй класс HateoasClient с методами:

getLink(resource, rel) — вернуть HateoasLink | null по rel.

hasLink(resource, rel) — boolean, есть ли такой rel в _links.

getAvailableActions(resource):

возвращает список rel, которые считаются действиями (исключая self, author, comments, next, prev, first, last).

executeAction(resource, action, payload?):

находит ссылку по rel,

определяет HTTP‑метод из link.type (или 'GET'),

делает запрос fetch(link.href, options),

возвращает распарсенный JSON ресурса.

parseTemplateLink(link, variables):

поддержка шаблонов вида "/api/posts{?page,size}",

подставляет значения из variables в query‑строку.

RTK Query (api/postsApi.ts)
Определи API через createApi:

baseUrl: 'http://localhost:3000/api'.

headers: Accept: application/hal+json, Content-Type: application/json.

tagTypes: ['Post'].

Endpoints:

getPost(id: number):

query: (id) => \/posts/${id}``,

возвращает BlogPost,

providesTags: [{ type: 'Post', id: result.id }, 'Post'].

listPosts({ page, size }):

принимает { page?: number; size?: number },

использует HateoasClient.parseTemplateLink({ href: '/posts{?page,size}', templated: true }, { page, size }),

возвращает HateoasCollection<BlogPost>,

providesTags:

для каждого поста { type: 'Post', id },

плюс { type: 'Post', id: 'LIST' }.

updatePost({ id, data }) (mutation):

сначала делает fetch('/api/posts/${id}'), парсит BlogPost,

проверяет наличие update в _links,

если нет — возвращает ошибку,

если есть — делает PUT по update.href с payload,

invalidatesTags: [{ type: 'Post', id }].

publishPost(id: number) (mutation):

получает пост по id,

вызывает HateoasClient.executeAction(post, 'publish'),

invalidatesTags: [{ type: 'Post', id }].

deletePost(id: number) (mutation):

аналогично, но с delete,

после успешного удаления:

invalidatesTags: [{ type: 'Post', id: 'LIST' }].

Экспортируй hooks: useGetPostQuery, useListPostsQuery, useUpdatePostMutation, usePublishPostMutation, useDeletePostMutation.

Хуки
useHateoasLinks(resource) (features/posts/hooks/useHateoasLinks.ts)
Принимает BlogPost | undefined.

Возвращает мемо‑объект:

canPublish, canArchive, canUpdate, canDelete — на основе HateoasClient.hasLink.

publishLink, archiveLink, updateLink, deleteLink — на основе HateoasClient.getLink.

allActions — HateoasClient.getAvailableActions(resource).

usePostActions(post) (features/posts/hooks/usePostActions.ts)
Принимает BlogPost | undefined.

Возвращает функцию executeAction(action: string, payload?), которая:

бросает, если post не передан,

проверяет наличие rel через hasLink,

если rel нет — кидает ActionNotAvailableError с перечислением доступных действий,

иначе вызывает HateoasClient.executeAction.

Компоненты
PostCard (features/posts/components/PostCard.tsx)
Пропсы: post: BlogPost, onEditClick?: () => void.

Показывает:

заголовок, часть content,

author, createdAt, status.

Подключает useHateoasLinks(post) и mutation hooks:

usePublishPostMutation,

useDeletePostMutation.

Кнопки:

Edit — если canUpdate,

Publish — если canPublish, вызывает publishPost(post.id),

Archive — если canArchive (можно пока заглушкой),

Delete — если canDelete, вызывает deletePost(post.id).

PostList (features/posts/components/PostList.tsx)
Локальный page в state.

Вызов useListPostsQuery({ page, size: 10 }).

Рендерит список PostCard.

Пагинация:

hasNextPage = HateoasClient.hasLink(collection, 'next'),

hasPrevPage = HateoasClient.hasLink(collection, 'prev'),

кнопки Previous/Next активны только если соответствующие ссылки есть,

при клике меняет page.

State machine (опционально, но желательно)
Добавь файл usePostStateMachine.ts:

Объект postStateMachine:
const postStateMachine = {
  DRAFT: { allowedTransitions: ['publish', 'delete', 'update'] },
  PUBLISHED: { allowedTransitions: ['archive', 'update'] },
  ARCHIVED: { allowedTransitions: ['republish', 'delete'] },
} as const;

Хук usePostStateMachine(post):

возвращает currentState, stateConfig, availableActions (из HATEOAS),

флаг isConsistent, если все allowedTransitions присутствуют в availableActions.

Тесты
Сделай базовый набор:

Моки:

mockBlogPost (DRAFT с publish, update, delete),

mockPublishedPost (PUBLISHED с archive, update),

mockPostsCollection с _embedded.items и _links.self/next/first/last.

Тесты для HateoasClient:

getLink возвращает корректную ссылку/null,

hasLink возвращает правильный boolean,

getAvailableActions не включает self/навигационные/author/comments,

parseTemplateLink корректно подставляет page/size.

Стиль реализации
Не зашивай конкретные URI в компоненты — все действия и навигация должны опираться на _links.

Условный рендеринг UI‑кнопок зависит только от наличия rel в _links.

Код должен быть читабельным, самодокументирующимся, без магических строк.

Что сделать
Создать/обновить файлы по структуре.

Реализовать типы, HATEOAS‑клиент, RTK Query endpoints и компоненты.

Добавить минимум юнит‑тестов на HATEOAS‑логику.

Использовать этот проект как шаблон для будущих HATEOAS‑интеграций.