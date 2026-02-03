/**
 * HAL (Hypertext Application Language) — типы и парсер.
 * Чтение _links / _embedded, раскрытие URI Template (RFC 6570).
 * Модуль самодостаточен, без внешних зависимостей.
 *
 * @example
 * import { getLink, parseTemplateLink, type HALResource, type HALLink } from './hal';
 * const link = getLink(resource, 'self');
 * const url = parseTemplateLink(link, { page: 1, size: 10 });
 */

export type {
  HALHttpMethod,
  HALLink,
  HALLinkValue,
  HALResource,
  HALCollection,
} from './types';

export {
  isHALResource,
  getLink,
  getLinks,
  getEmbedded,
  parseTemplateLink,
  NAVIGATION_RELS,
  getActionRels,
} from './parser';
