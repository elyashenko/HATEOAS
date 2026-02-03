import type { HALLink, HALResource, HALLinkValue } from './types';

// RFC 6570 URI Template: query {?param1,param2}, path {id}
const URI_TEMPLATE_QUERY = /\{\?([^}]+)\}/;
const URI_TEMPLATE_PLACEHOLDER = /\{[^}]+\}/g;

/**
 * Возвращает сырое значение _links[rel] (ссылка или массив ссылок).
 * Внутренняя функция для устранения дублирования в getLink/getLinks.
 */
function getLinkValue(
  resource: HALResource | undefined | null,
  rel: string
): HALLinkValue | undefined {
  if (
    !resource?._links ||
    typeof resource._links !== 'object' ||
    Array.isArray(resource._links)
  ) {
    return undefined;
  }
  return resource._links[rel];
}

/**
 * Проверяет, что значение является HAL Resource Object (раздел 4 спецификации).
 * Ресурс может не иметь _links и _embedded; проверяются только зарезервированные свойства.
 *
 * @param value — произвольное значение
 * @returns type guard: true если value — HALResource
 */
export function isHALResource(value: unknown): value is HALResource {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as HALResource;
  if (candidate._links !== undefined) {
    if (typeof candidate._links !== 'object' || candidate._links === null || Array.isArray(candidate._links)) {
      return false;
    }
  }
  if (candidate._embedded !== undefined) {
    if (
      typeof candidate._embedded !== 'object' ||
      candidate._embedded === null ||
      Array.isArray(candidate._embedded)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Возвращает одну ссылку по отношению rel.
 * Если в ресурсе по этому rel задан массив ссылок, возвращается первый элемент.
 *
 * @param resource — HAL-ресурс (или null/undefined)
 * @param rel — имя связи (relation type)
 * @returns ссылка или null
 */
export function getLink(
  resource: HALResource | undefined | null,
  rel: string
): HALLink | null {
  const raw = getLinkValue(resource, rel);
  if (raw === undefined) {
    return null;
  }
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return raw;
}

/**
 * Возвращает все ссылки по отношению rel.
 * Всегда массив: одна ссылка возвращается как [link], несколько — без изменений.
 *
 * @param resource — HAL-ресурс (или null/undefined)
 * @param rel — имя связи (relation type)
 * @returns массив ссылок (новый массив, не ссылка на внутренний)
 */
export function getLinks(
  resource: HALResource | undefined | null,
  rel: string
): HALLink[] {
  const raw = getLinkValue(resource, rel);
  if (raw === undefined) {
    return [];
  }
  return Array.isArray(raw) ? [...raw] : [raw];
}

/**
 * Возвращает вложенный ресурс или коллекцию по ключу из _embedded.
 *
 * @param resource — HAL-ресурс (или null/undefined)
 * @param key — ключ в _embedded
 * @returns значение или null
 */
export function getEmbedded<T = unknown>(
  resource: HALResource | undefined | null,
  key: string
): T | null {
  if (
    !resource?._embedded ||
    typeof resource._embedded !== 'object' ||
    Array.isArray(resource._embedded)
  ) {
    return null;
  }
  const value = resource._embedded[key];
  return value !== undefined ? (value as T) : null;
}

/**
 * Подставляет query-параметры в шаблон вида {?page,size}.
 */
function expandQueryTemplate(
  href: string,
  variables: Record<string, string | number | boolean | undefined>
): string {
  const match = href.match(URI_TEMPLATE_QUERY);
  if (!match) {
    return href;
  }
  const paramNames = match[1].split(',').map((p) => p.trim());
  const pairs: string[] = [];
  for (const name of paramNames) {
    const value = variables[name];
    if (value !== undefined && value !== null && value !== '') {
      pairs.push(`${name}=${encodeURIComponent(String(value))}`);
    }
  }
  const prefix = href.slice(0, match.index ?? 0);
  const separator = prefix.includes('?') ? '&' : '?';
  const replacement = pairs.length > 0 ? separator + pairs.join('&') : '';
  return href.replace(match[0], replacement);
}

/**
 * Подставляет path-параметры в плейсхолдеры вида {id}.
 */
function expandPathTemplate(
  href: string,
  variables: Record<string, string | number | boolean | undefined>
): string {
  const placeholders = href.match(URI_TEMPLATE_PLACEHOLDER);
  if (!placeholders) {
    return href;
  }
  let result = href;
  for (const placeholder of placeholders) {
    const paramName = placeholder.slice(1, -1).trim();
    const value = variables[paramName];
    if (value !== undefined && value !== null) {
      const encoded = encodeURIComponent(String(value));
      result = result.split(placeholder).join(encoded);
    }
  }
  return result;
}

/**
 * Разворачивает URI Template (RFC 6570) в ссылке.
 * Поддерживаются query-шаблон {?page,size} и path-плейсхолдеры {id}.
 * Если link.templated не true, возвращается link.href без изменений.
 *
 * @param link — HAL-ссылка (поле templated опционально)
 * @param variables — значения для подстановки
 * @returns итоговый URL
 */
export function parseTemplateLink(
  link: HALLink,
  variables: Record<string, string | number | boolean | undefined>
): string {
  if (!link.templated) {
    return link.href;
  }
  const afterQuery = expandQueryTemplate(link.href, variables);
  return expandPathTemplate(afterQuery, variables);
}

/**
 * Rel-типы, считающиеся навигационными (не действиями).
 * Не изменяйте этот Set: для кастомизации скопируйте значения и используйте свой набор в логике приложения.
 */
export const NAVIGATION_RELS: ReadonlySet<string> = new Set([
  'self',
  'author',
  'comments',
  'next',
  'prev',
  'first',
  'last',
]);

/**
 * Возвращает имена связей (rel), считающиеся действиями:
 * все ключи из _links, кроме навигационных (NAVIGATION_RELS).
 *
 * @param resource — HAL-ресурс (или null/undefined)
 * @returns массив rel
 */
export function getActionRels(
  resource: HALResource | undefined | null
): string[] {
  if (
    !resource?._links ||
    typeof resource._links !== 'object' ||
    Array.isArray(resource._links)
  ) {
    return [];
  }
  return Object.keys(resource._links).filter((rel) => !NAVIGATION_RELS.has(rel));
}
