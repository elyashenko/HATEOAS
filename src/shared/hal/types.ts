/**
 * Типы для HAL (Hypertext Application Language).
 * Спецификация: RFC 5988 (Web Linking), RFC 6570 (URI Template).
 * Модуль самодостаточен и может быть вынесен в отдельный пакет.
 */

/** Допустимые HTTP-методы для ссылок HAL */
export type HALHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Ссылка HAL (элемент объекта _links).
 * Обязательное поле: href. Остальные — по спецификации и расширениям.
 */
export interface HALLink {
  /** URI ссылки или URI Template */
  href: string;
  /** Relation type (если не совпадает с ключом в _links) */
  rel?: string;
  /** Hint для media type целевого ресурса */
  type?: string;
  /** HTTP-метод (для не-GET) */
  method?: HALHttpMethod;
  /** true, если href — URI Template */
  templated?: boolean;
  /** Человекочитаемое описание */
  title?: string;
  /** Доп. свойства: deprecation, name, profile, hreflang и т.д. */
  [key: string]: unknown;
}

/**
 * Значение по одному ключу в _links: одна ссылка или массив ссылок (HAL допускает оба варианта).
 */
export type HALLinkValue = HALLink | HALLink[];

/**
 * Базовый HAL-ресурс.
 * Обязательно поле _links; _embedded и остальные свойства — опциональны.
 */
export interface HALResource {
  /** Связи ресурса: rel → ссылка или массив ссылок */
  _links: Record<string, HALLinkValue>;
  /** Вложенные ресурсы */
  _embedded?: Record<string, unknown>;
  /** Собственные свойства ресурса */
  [key: string]: unknown;
}

/**
 * HAL-коллекция с типизированным списком элементов и полями пагинации.
 */
export interface HALCollection<T extends HALResource = HALResource> extends HALResource {
  _embedded?: {
    items: T[];
    [key: string]: unknown;
  };
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}
