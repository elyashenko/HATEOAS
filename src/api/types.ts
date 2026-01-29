/**
 * Типы для работы с HAL+JSON ресурсами в архитектуре HATEOAS
 */

/**
 * Ссылка HATEOAS с метаданными
 */
export interface HateoasLink {
  href: string;
  rel?: string;
  type?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  templated?: boolean;
  title?: string;
}

/**
 * Базовый интерфейс для HAL ресурса
 * @template T - тип данных ресурса (используется в HateoasCollection)
 */
export interface HateoasResource<_T = Record<string, unknown>> {
  _links: Record<string, HateoasLink | HateoasLink[]>;
  _embedded?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * HAL коллекция с пагинацией
 */
export interface HateoasCollection<T extends HateoasResource> extends HateoasResource {
  _embedded?: {
    items: T[];
  };
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

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
export interface BlogPost extends HateoasResource {
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
