import type { HateoasLink } from '../../api/types';
import { resolveApiUrl } from '../../api/config';

/**
 * Утилиты для работы со ссылками
 */

/**
 * Получить абсолютный URL из ссылки
 */
export function getAbsoluteUrl(link: HateoasLink | null): string | null {
  if (!link) {
    return null;
  }

  return resolveApiUrl(link.href);
}

/**
 * Проверить, является ли ссылка действием (не навигационной)
 */
export function isActionLink(rel: string): boolean {
  const navigationRels = ['self', 'author', 'comments', 'next', 'prev', 'first', 'last'];
  return !navigationRels.includes(rel);
}

/**
 * Получить HTTP метод для ссылки
 */
export function getHttpMethod(link: HateoasLink | null): string {
  return link?.method || 'GET';
}
