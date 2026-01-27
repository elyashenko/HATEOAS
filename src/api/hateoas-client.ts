import type { HateoasLink, HateoasResource, LinkRelationType } from './types';

/**
 * Универсальный клиент для работы с HATEOAS ссылками
 */
export class HateoasClient {
  /**
   * Получить ссылку по rel из ресурса
   */
  static getLink<T extends HateoasResource>(
    resource: T | undefined | null,
    rel: LinkRelationType | string
  ): HateoasLink | null {
    if (!resource?._links) {
      return null;
    }

    const link = resource._links[rel];
    if (!link) {
      return null;
    }

    // Если массив ссылок, возвращаем первую
    if (Array.isArray(link)) {
      return link[0] || null;
    }

    return link;
  }

  /**
   * Проверить наличие ссылки с указанным rel
   */
  static hasLink<T extends HateoasResource>(
    resource: T | undefined | null,
    rel: LinkRelationType | string
  ): boolean {
    return this.getLink(resource, rel) !== null;
  }

  /**
   * Получить список доступных действий (исключая навигационные и служебные ссылки)
   */
  static getAvailableActions<T extends HateoasResource>(
    resource: T | undefined | null
  ): string[] {
    if (!resource?._links) {
      return [];
    }

    const navigationRels: Set<string> = new Set([
      'self',
      'author',
      'comments',
      'next',
      'prev',
      'first',
      'last',
    ]);

    return Object.keys(resource._links).filter((rel) => !navigationRels.has(rel));
  }

  /**
   * Выполнить действие по ссылке
   */
  static async executeAction<T extends HateoasResource>(
    resource: T,
    action: LinkRelationType | string,
    payload?: unknown
  ): Promise<HateoasResource> {
    const link = this.getLink(resource, action);
    if (!link) {
      throw new Error(`Action "${action}" is not available for this resource`);
    }

    const method = link.method || 'GET';
    const url = link.href.startsWith('http') ? link.href : `http://localhost:3000${link.href}`;

    const options: RequestInit = {
      method,
      headers: {
        'Accept': 'application/hal+json',
        'Content-Type': 'application/json',
      },
    };

    if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Failed to execute action "${action}": ${response.statusText}`);
    }

    return (await response.json()) as HateoasResource;
  }

  /**
   * Распарсить шаблонную ссылку с подстановкой переменных
   */
  static parseTemplateLink(
    link: HateoasLink,
    variables: Record<string, string | number | undefined>
  ): string {
    if (!link.templated) {
      return link.href;
    }

    let href = link.href;

    // Обработка шаблонов вида "/api/posts{?page,size}"
    const templateMatch = href.match(/\{(\?)?([^}]+)\}/);
    if (templateMatch) {
      const isQuery = templateMatch[1] === '?';
      const params = templateMatch[2].split(',').map((p) => p.trim());

      if (isQuery) {
        const queryParams: string[] = [];
        params.forEach((param) => {
          const value = variables[param];
          if (value !== undefined && value !== null) {
            queryParams.push(`${param}=${encodeURIComponent(value)}`);
          }
        });

        if (queryParams.length > 0) {
          // Проверяем, есть ли уже query параметры в URL (до шаблона)
          const urlBeforeTemplate = href.substring(0, templateMatch.index || 0);
          const separator = urlBeforeTemplate.includes('?') ? '&' : '?';
          href = href.replace(templateMatch[0], separator + queryParams.join('&'));
        } else {
          href = href.replace(templateMatch[0], '');
        }
      } else {
        // Обработка path параметров вида {id}
        params.forEach((param) => {
          const value = variables[param];
          if (value !== undefined && value !== null) {
            href = href.replace(`{${param}}`, String(value));
          }
        });
      }
    }

    return href;
  }
}
