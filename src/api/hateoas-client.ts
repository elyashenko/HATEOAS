import type { HateoasLink, HateoasResource, LinkRelationType } from './types';
import { resolveApiUrl } from './config';
import { getLink as halGetLink, getActionRels, parseTemplateLink as halParseTemplateLink } from '../shared/hal';

/**
 * Универсальный клиент для работы с HATEOAS ссылками (поверх HAL-парсера)
 */
export class HateoasClient {
  /**
   * Получить ссылку по rel из ресурса
   */
  static getLink<T extends HateoasResource>(
    resource: T | undefined | null,
    rel: LinkRelationType | string
  ): HateoasLink | null {
    return halGetLink(resource ?? undefined, rel);
  }

  /**
   * Проверить наличие ссылки с указанным rel
   */
  static hasLink<T extends HateoasResource>(
    resource: T | undefined | null,
    rel: LinkRelationType | string
  ): boolean {
    return halGetLink(resource ?? undefined, rel) !== null;
  }

  /**
   * Получить список доступных действий (исключая навигационные и служебные ссылки)
   */
  static getAvailableActions<T extends HateoasResource>(
    resource: T | undefined | null
  ): string[] {
    return getActionRels(resource ?? undefined);
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
    const url = resolveApiUrl(link.href);

    const options: RequestInit = {
      method,
      headers: {
        'Accept': 'application/hal+json',
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      options.body = payload !== undefined && payload !== null
        ? JSON.stringify(payload)
        : '{}';
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const body = await response.text();
      const err = new Error(`Failed to execute action "${action}": ${response.statusText}`) as Error & { status?: number; data?: string };
      err.status = response.status;
      err.data = body;
      throw err;
    }

    return (await response.json()) as HateoasResource;
  }

  /**
   * Распарсить шаблонную ссылку с подстановкой переменных (RFC 6570)
   */
  static parseTemplateLink(
    link: HateoasLink,
    variables: Record<string, string | number | undefined>
  ): string {
    return halParseTemplateLink(link, variables);
  }
}
