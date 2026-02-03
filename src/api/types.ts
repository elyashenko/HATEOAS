/**
 * Типы для работы с HAL+JSON ресурсами в архитектуре HATEOAS.
 * Базовые HAL-типы переэкспортируются из общего модуля hal.
 */

import type { HALLink, HALResource, HALCollection } from '../shared/hal';

export type HateoasLink = HALLink;
export type HateoasResource = HALResource;
export type HateoasCollection<T extends HALResource = HALResource> = HALCollection<T>;

/**
 * Типы связей (rel) для постов
 */
export type LinkRelationType =
  | 'self'
  | 'publish'
  | 'update'
  | 'delete'
  | 'archive'
  | 'republish'
  | 'comments'
  | 'author'
  | 'next'
  | 'prev'
  | 'first'
  | 'last';

/**
 * Статус поста
 */
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Пост блога как HAL ресурс
 */
export interface BlogPost extends HALResource {
  id: number;
  title: string;
  content: string;
  author: string;
  status: PostStatus;
  createdAt: string;
  publishedAt: string | null;
}

/**
 * Ошибка при выполнении действия, которое недоступно
 */
export class ActionNotAvailableError extends Error {
  constructor(
    public readonly action: string,
    public readonly availableActions: string[]
  ) {
    super(
      `Action "${action}" is not available. Available actions: ${availableActions.join(', ')}`
    );
    this.name = 'ActionNotAvailableError';
  }
}
