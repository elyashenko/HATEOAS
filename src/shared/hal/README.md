# HAL Parser

Парсер формата **HAL** (Hypertext Application Language): типы и функции для чтения `_links` / `_embedded` и раскрытия URI Template (RFC 6570).

Модуль самодостаточен: нет внешних зависимостей, только TypeScript. Папку `hal` можно скопировать в другой проект и использовать без изменений.

---

## Экспорт

**Типы:** `HALLink`, `HALResource`, `HALCollection<T>`, `HALLinkValue`, `HALHttpMethod`

**Функции:**

| Функция | Описание |
|--------|----------|
| `isHALResource(value)` | Type guard: проверка, что значение — HAL-ресурс (есть объект `_links`) |
| `getLink(resource, rel)` | Одна ссылка по `rel` (если массив — первая) |
| `getLinks(resource, rel)` | Все ссылки по `rel` (всегда массив) |
| `getEmbedded(resource, key)` | Вложенный ресурс из `_embedded[key]` |
| `parseTemplateLink(link, variables)` | Раскрытие URI Template в `href` (query `{?page,size}` и path `{id}`) |
| `getActionRels(resource)` | Список rel, не входящих в навигационные |

**Константа:** `NAVIGATION_RELS` — `ReadonlySet` с rel-типами навигации (`self`, `next`, `prev`, …). Не изменяйте: для своей логики используйте копию или отдельный набор.

---

## Пример

```ts
import { getLink, getEmbedded, parseTemplateLink, type HALResource } from './hal';

const resource: HALResource = await response.json();
const self = getLink(resource, 'self');
const items = getEmbedded<MyItem[]>(resource, 'items');
const url = parseTemplateLink(link, { page: 1, size: 10 });
```

---

## Спецификации

- [RFC 5988](https://tools.ietf.org/html/rfc5988) — Web Linking  
- [RFC 6570](https://tools.ietf.org/html/rfc6570) — URI Template  
- [HAL — Hypertext Application Language](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal)
