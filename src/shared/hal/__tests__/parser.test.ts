import { describe, it, expect } from 'vitest';
import {
  isHALResource,
  getLink,
  getLinks,
  getEmbedded,
  parseTemplateLink,
  NAVIGATION_RELS,
  getActionRels,
} from '../parser';
import type { HALResource, HALLink } from '../types';

describe('hal/parser', () => {
  describe('isHALResource', () => {
    it('возвращает true для объекта с _links', () => {
      expect(isHALResource({ _links: {} })).toBe(true);
      expect(isHALResource({ _links: { self: { href: '/api' } } })).toBe(true);
    });

    it('возвращает true для ресурса с _embedded', () => {
      expect(isHALResource({ _links: {}, _embedded: { items: [] } })).toBe(true);
    });

    it('возвращает false для null и undefined', () => {
      expect(isHALResource(null)).toBe(false);
      expect(isHALResource(undefined)).toBe(false);
    });

    it('возвращает false для не-объекта', () => {
      expect(isHALResource(1)).toBe(false);
      expect(isHALResource('')).toBe(false);
      expect(isHALResource(true)).toBe(false);
    });

    it('возвращает true для объекта без _links (_links опционален по спецификации)', () => {
      expect(isHALResource({})).toBe(true);
      expect(isHALResource({ id: 1, title: 'x' })).toBe(true);
    });

    it('возвращает false если _links присутствует но не объект или массив', () => {
      expect(isHALResource({ _links: null })).toBe(false);
      expect(isHALResource({ _links: 'invalid' })).toBe(false);
      expect(isHALResource({ _links: [] })).toBe(false);
    });

    it('возвращает false если _embedded присутствует но не объект (в т.ч. массив)', () => {
      expect(isHALResource({ _embedded: null })).toBe(false);
      expect(isHALResource({ _embedded: 'invalid' })).toBe(false);
      expect(isHALResource({ _embedded: [] })).toBe(false);
    });
  });

  describe('getLink', () => {
    it('возвращает ссылку по rel', () => {
      const resource: HALResource = {
        _links: {
          self: { href: '/api/posts/1' },
          update: { href: '/api/posts/1', method: 'PUT' },
        },
      };
      expect(getLink(resource, 'self')).toEqual({ href: '/api/posts/1' });
      expect(getLink(resource, 'update')).toEqual({ href: '/api/posts/1', method: 'PUT' });
    });

    it('возвращает null если rel нет', () => {
      const resource: HALResource = {
        _links: { self: { href: '/api' } },
      };
      expect(getLink(resource, 'missing')).toBeNull();
    });

    it('возвращает первую ссылку если значение — массив', () => {
      const resource: HALResource = {
        _links: {
          items: [
            { href: '/api/1' },
            { href: '/api/2' },
          ],
        },
      };
      expect(getLink(resource, 'items')).toEqual({ href: '/api/1' });
    });

    it('возвращает null для пустого массива ссылок', () => {
      const resource: HALResource = {
        _links: { items: [] },
      };
      expect(getLink(resource, 'items')).toBeNull();
    });

    it('возвращает null для null/undefined ресурса', () => {
      expect(getLink(null, 'self')).toBeNull();
      expect(getLink(undefined, 'self')).toBeNull();
    });

    it('возвращает null если _links отсутствует', () => {
      const resource = { _embedded: {} } as HALResource;
      expect(getLink(resource, 'self')).toBeNull();
    });
  });

  describe('getLinks', () => {
    it('возвращает массив из одной ссылки', () => {
      const resource: HALResource = {
        _links: { self: { href: '/api' } },
      };
      expect(getLinks(resource, 'self')).toEqual([{ href: '/api' }]);
    });

    it('возвращает копию массива ссылок', () => {
      const resource: HALResource = {
        _links: {
          items: [
            { href: '/api/1' },
            { href: '/api/2' },
          ],
        },
      };
      const result = getLinks(resource, 'items');
      expect(result).toHaveLength(2);
      expect(result).toEqual([{ href: '/api/1' }, { href: '/api/2' }]);
      expect(result).not.toBe(resource._links!.items);
    });

    it('возвращает пустой массив если rel нет', () => {
      const resource: HALResource = { _links: {} };
      expect(getLinks(resource, 'missing')).toEqual([]);
    });

    it('возвращает пустой массив для null/undefined ресурса', () => {
      expect(getLinks(null, 'self')).toEqual([]);
      expect(getLinks(undefined, 'self')).toEqual([]);
    });
  });

  describe('getEmbedded', () => {
    it('возвращает значение по ключу', () => {
      const resource: HALResource = {
        _links: {},
        _embedded: {
          items: [{ _links: { self: { href: '/1' } } }],
          meta: { total: 42 },
        },
      };
      expect(getEmbedded(resource, 'items')).toEqual([{ _links: { self: { href: '/1' } } }]);
      expect(getEmbedded<{ total: number }>(resource, 'meta')).toEqual({ total: 42 });
    });

    it('возвращает null если ключа нет', () => {
      const resource: HALResource = {
        _links: {},
        _embedded: { items: [] },
      };
      expect(getEmbedded(resource, 'missing')).toBeNull();
    });

    it('возвращает null если _embedded нет', () => {
      const resource: HALResource = { _links: {} };
      expect(getEmbedded(resource, 'items')).toBeNull();
    });

    it('возвращает null для null/undefined ресурса', () => {
      expect(getEmbedded(null, 'items')).toBeNull();
      expect(getEmbedded(undefined, 'items')).toBeNull();
    });

    it('возвращает null если _embedded — массив (по спецификации должен быть объект)', () => {
      const resource = { _embedded: [] } as unknown as HALResource;
      expect(getEmbedded(resource, 'items')).toBeNull();
    });
  });

  describe('parseTemplateLink', () => {
    it('для нешаблонной ссылки возвращает href как есть', () => {
      const link: HALLink = { href: '/api/posts/1' };
      expect(parseTemplateLink(link, {})).toBe('/api/posts/1');
    });

    it('подставляет query-параметры в {?page,size}', () => {
      const link: HALLink = {
        href: '/api/posts{?page,size}',
        templated: true,
      };
      expect(parseTemplateLink(link, { page: 2, size: 10 })).toBe('/api/posts?page=2&size=10');
    });

    it('игнорирует undefined/null/пустые значения в query', () => {
      const link: HALLink = {
        href: '/api/posts{?page,size}',
        templated: true,
      };
      expect(parseTemplateLink(link, { page: 1 })).toBe('/api/posts?page=1');
      expect(parseTemplateLink(link, {})).toBe('/api/posts');
    });

    it('кодирует значения в query', () => {
      const link: HALLink = {
        href: '/api/search{?q}',
        templated: true,
      };
      expect(parseTemplateLink(link, { q: 'a b' })).toBe('/api/search?q=a%20b');
    });

    it('подставляет path-параметры {id}', () => {
      const link: HALLink = {
        href: '/api/posts/{id}',
        templated: true,
      };
      expect(parseTemplateLink(link, { id: 42 })).toBe('/api/posts/42');
    });

    it('кодирует path-параметры', () => {
      const link: HALLink = {
        href: '/api/users/{name}',
        templated: true,
      };
      expect(parseTemplateLink(link, { name: 'a/b' })).toBe('/api/users/a%2Fb');
    });

    it('принимает boolean в variables', () => {
      const link: HALLink = {
        href: '/api/items{?active}',
        templated: true,
      };
      expect(parseTemplateLink(link, { active: true })).toBe('/api/items?active=true');
    });

    it('заменяет все вхождения одного path-плейсхолдера', () => {
      const link: HALLink = {
        href: '/api/{id}/copy/{id}',
        templated: true,
      };
      expect(parseTemplateLink(link, { id: 'x' })).toBe('/api/x/copy/x');
    });
  });

  describe('NAVIGATION_RELS', () => {
    it('содержит ожидаемые навигационные rel', () => {
      expect(NAVIGATION_RELS.has('self')).toBe(true);
      expect(NAVIGATION_RELS.has('next')).toBe(true);
      expect(NAVIGATION_RELS.has('prev')).toBe(true);
      expect(NAVIGATION_RELS.has('first')).toBe(true);
      expect(NAVIGATION_RELS.has('last')).toBe(true);
      expect(NAVIGATION_RELS.has('author')).toBe(true);
      expect(NAVIGATION_RELS.has('comments')).toBe(true);
      expect(NAVIGATION_RELS.has('publish')).toBe(false);
    });
  });

  describe('getActionRels', () => {
    it('возвращает только rel действий, без навигационных', () => {
      const resource: HALResource = {
        _links: {
          self: { href: '/api/posts/1' },
          publish: { href: '/api/posts/1/publish', method: 'POST' },
          update: { href: '/api/posts/1', method: 'PUT' },
          author: { href: '/api/authors/1' },
          comments: { href: '/api/posts/1/comments' },
        },
      };
      const actions = getActionRels(resource);
      expect(actions).toContain('publish');
      expect(actions).toContain('update');
      expect(actions).not.toContain('self');
      expect(actions).not.toContain('author');
      expect(actions).not.toContain('comments');
    });

    it('возвращает пустой массив при отсутствии _links', () => {
      expect(getActionRels(null)).toEqual([]);
      expect(getActionRels(undefined)).toEqual([]);
    });

    it('возвращает пустой массив если все ссылки навигационные', () => {
      const resource: HALResource = {
        _links: {
          self: { href: '/api' },
          next: { href: '/api?page=2' },
        },
      };
      expect(getActionRels(resource)).toEqual([]);
    });
  });
});
