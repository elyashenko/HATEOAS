# HAL Parser

Парсер формата **HAL** (Hypertext Application Language): типы и функции для чтения `_links` / `_embedded` и раскрытия URI Template (RFC 6570).

Модуль самодостаточен: нет внешних зависимостей, только TypeScript. Папку `hal` можно скопировать в другой проект и использовать без изменений.

---

## Экспорт

**Типы:** `HALLink`, `HALResource`, `HALCollection<T>`, `HALLinkValue`, `HALHttpMethod`

**Функции:**

| Функция | Описание |
|--------|----------|
| `isHALResource(value)` | Type guard: проверка, что значение — Resource Object (корректные _links/_embedded при наличии) |
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

## Соответствие спецификации

Типы и парсер ориентированы на [draft-kelly-json-hal](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal) (JSON Hypertext Application Language):

- **Resource Object (раздел 4):** _links и _embedded опциональны; остальные свойства — состояние ресурса.
- **Link Object (раздел 5):** href (обязательно), templated, type (HTTP-метод запроса), deprecation, name, profile, title, hreflang.
- **_links:** ключи — link relation types [RFC 5988], значения — одна ссылка или массив ссылок.
- **_embedded:** ключи — relation types, значения — Resource Object или массив (в типах — `unknown` для гибкости).

Расширение URI Template (раздел 5.1, RFC 6570) поддерживается в `parseTemplateLink`. Curies (раздел 8.3) не обрабатываются — связь `curies` трактуется как обычный rel.

**Нормативные ссылки:** [RFC 5988](https://tools.ietf.org/html/rfc5988), [RFC 6570](https://tools.ietf.org/html/rfc6570), [RFC 3986](https://tools.ietf.org/html/rfc3986).
