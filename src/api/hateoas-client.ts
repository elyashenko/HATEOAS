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

    const method = (typeof link.type === 'string' && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(link.type) ? link.type : 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    const url = resolveApiUrl(link.href);

    // Логируем для отладки в production
    if (typeof console !== 'undefined') {
      console.log('[HateoasClient] Executing action:', {
        action,
        originalHref: link.href,
        resolvedUrl: url,
        method,
        windowLocation: typeof window !== 'undefined' ? window.location.href : 'N/A',
      });
    }

    const options: RequestInit = {
      method,
      headers: {
        'Accept': 'application/hal+json',
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      // Для запросов без payload не отправляем тело (некоторые серверы могут требовать отсутствие тела)
      if (payload !== undefined && payload !== null) {
        options.body = JSON.stringify(payload);
      }
      // Если payload не передан, не устанавливаем body (undefined)
      // Это правильно для запросов типа archive, которые не требуют тела
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorData: unknown;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = text || response.statusText;
        }
      } catch {
        errorData = response.statusText;
      }
      
      const err = new Error(`Failed to execute action "${action}": ${response.statusText}`) as Error & { status?: number; data?: unknown };
      err.status = response.status;
      err.data = errorData;
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
