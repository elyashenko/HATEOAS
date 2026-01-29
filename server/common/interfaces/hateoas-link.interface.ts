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
