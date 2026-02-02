export interface HateoasLink {
  href: string;
  rel?: string;
  type?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  templated?: boolean;
  title?: string;
}

export interface HateoasResource {
  _links: Record<string, HateoasLink | HateoasLink[]>;
  _embedded?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HateoasCollection<T extends HateoasResource> extends HateoasResource {
  _embedded?: {
    items: T[];
  };
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

/** Ответ API: один пост в формате HAL+JSON (явные _links) */
export interface PostHalResponse {
  id: number;
  title: string;
  content: string;
  author: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  _links: Record<string, HateoasLink>;
}

/** Ответ API: коллекция постов в формате HAL+JSON (явные _links и _embedded) */
export interface PostsCollectionHalResponse {
  _links: Record<string, HateoasLink>;
  _embedded: {
    items: PostHalResponse[];
  };
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
