/**
 * Типы для HAL (JSON Hypertext Application Language).
 * Спецификация: draft-kelly-json-hal (IETF), RFC 5988 (Web Linking), RFC 6570 (URI Template).
 *
 * @see https://datatracker.ietf.org/doc/html/draft-kelly-json-hal
 */

/** HTTP-метод для ссылки (расширение HAL; в спецификации Link Object не определяет method) */
export type HALHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Link Object (раздел 5 спецификации).
 * Имена свойств — link relation types по RFC 5988; тип связи задаётся ключом в _links.
 */
export interface HALLink {
  /** URI или URI Template [RFC3986, RFC6570] — обязательно (раздел 5.1) */
  href: string;
  /** templated: true, если href — URI Template (5.2) */
  templated?: boolean;
  /** Подсказка media type целевого ресурса (5.3) */
  type?: string;
  /** Признак устаревания: URL с информацией о deprecation (5.4) */
  deprecation?: string;
  /** Вторичный ключ при нескольких ссылках с одним relation type (5.5) */
  name?: string;
  /** URI профиля целевого ресурса [RFC6906] (5.6) */
  profile?: string;
  /** Человекочитаемая метка [RFC5988] (5.7) */
  title?: string;
  /** Язык целевого ресурса [RFC5988] (5.8) */
  hreflang?: string;
  /** Расширение: HTTP-метод (в спецификации HAL не описан) */
  method?: HALHttpMethod;
  /** Relation type, если дублируется в теле ссылки (расширение) */
  rel?: string;
  [key: string]: unknown;
}

/**
 * Значение по одному ключу в _links: одна ссылка или массив ссылок (раздел 4.1.1).
 */
export type HALLinkValue = HALLink | HALLink[];

/**
 * Resource Object (раздел 4).
 * Корневой объект HAL-документа; _links и _embedded опциональны по спецификации.
 */
export interface HALResource {
  /** Связи ресурса: link relation type → Link Object или массив Link Objects (4.1.1, OPTIONAL) */
  _links?: Record<string, HALLinkValue>;
  /** Вложенные ресурсы: relation type → Resource Object или массив (4.1.2, OPTIONAL) */
  _embedded?: Record<string, unknown>;
  /** Остальные свойства — состояние ресурса (valid JSON) */
  [key: string]: unknown;
}

/**
 * HAL-коллекция с типизированным _embedded.items и полями пагинации.
 * Пагинация — соглашение поверх HAL, не часть спецификации.
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
