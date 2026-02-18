import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HateoasClient } from '../hateoas-client';
import type { BlogPost, HateoasLink } from '../types';

// Моки для fetch
globalThis.fetch = vi.fn() as typeof fetch;

describe('HateoasClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLink', () => {
    it('должен вернуть ссылку по rel', () => {
      const post: BlogPost = {
        id: 1,
        title: 'Test Post',
        content: 'Content',
        author: 'Author',
        status: 'DRAFT',
        createdAt: '2025-01-20T10:00:00Z',
        publishedAt: null,
        _links: {
          self: { href: '/api/posts/1' },
          publish: { href: '/api/posts/1/publish', type: 'POST' },
        },
      };

      const link = HateoasClient.getLink(post, 'publish');
      expect(link).toEqual({ href: '/api/posts/1/publish', type: 'POST' });
    });

    it('должен вернуть null если ссылка не найдена', () => {
      const post: BlogPost = {
        id: 1,
        title: 'Test Post',
        content: 'Content',
        author: 'Author',
        status: 'DRAFT',
        createdAt: '2025-01-20T10:00:00Z',
        publishedAt: null,
        _links: {
          self: { href: '/api/posts/1' },
        },
      };

      const link = HateoasClient.getLink(post, 'publish');
      expect(link).toBeNull();
    });

    it('должен вернуть первую ссылку если массив ссылок', () => {
      const post: BlogPost = {
        id: 1,
        title: 'Test Post',
        content: 'Content',
        author: 'Author',
        status: 'DRAFT',
        createdAt: '2025-01-20T10:00:00Z',
        publishedAt: null,
        _links: {
          self: { href: '/api/posts/1' },
          comments: [
            { href: '/api/posts/1/comments/1' },
            { href: '/api/posts/1/comments/2' },
          ],
        },
      };

      const link = HateoasClient.getLink(post, 'comments');
      expect(link).toEqual({ href: '/api/posts/1/comments/1' });
    });
  });

  describe('hasLink', () => {
    it('должен вернуть true если ссылка существует', () => {
      const post: BlogPost = {
        id: 1,
        title: 'Test Post',
        content: 'Content',
        author: 'Author',
        status: 'DRAFT',
        createdAt: '2025-01-20T10:00:00Z',
        publishedAt: null,
        _links: {
          self: { href: '/api/posts/1' },
          publish: { href: '/api/posts/1/publish' },
        },
      };

      expect(HateoasClient.hasLink(post, 'publish')).toBe(true);
      expect(HateoasClient.hasLink(post, 'delete')).toBe(false);
    });
  });

  describe('getAvailableActions', () => {
    it('должен вернуть только действия, исключая навигационные ссылки', () => {
      const post: BlogPost = {
        id: 1,
        title: 'Test Post',
        content: 'Content',
        author: 'Author',
        status: 'DRAFT',
        createdAt: '2025-01-20T10:00:00Z',
        publishedAt: null,
        _links: {
          self: { href: '/api/posts/1' },
          publish: { href: '/api/posts/1/publish' },
          update: { href: '/api/posts/1', type: 'PUT' },
          delete: { href: '/api/posts/1', type: 'DELETE' },
          author: { href: '/api/authors/1' },
          comments: { href: '/api/posts/1/comments' },
        },
      };

      const actions = HateoasClient.getAvailableActions(post);
      expect(actions).toContain('publish');
      expect(actions).toContain('update');
      expect(actions).toContain('delete');
      expect(actions).not.toContain('self');
      expect(actions).not.toContain('author');
      expect(actions).not.toContain('comments');
    });
  });

  describe('parseTemplateLink', () => {
    it('должен подставить query параметры в шаблонную ссылку', () => {
      const link: HateoasLink = {
        href: '/api/posts{?page,size}',
        templated: true,
      };

      const result = HateoasClient.parseTemplateLink(link, { page: 2, size: 10 });
      expect(result).toBe('/api/posts?page=2&size=10');
    });

    it('должен игнорировать undefined значения', () => {
      const link: HateoasLink = {
        href: '/api/posts{?page,size}',
        templated: true,
      };

      const result = HateoasClient.parseTemplateLink(link, { page: 2 });
      expect(result).toBe('/api/posts?page=2');
    });

    it('должен вернуть исходную ссылку если не шаблонная', () => {
      const link: HateoasLink = {
        href: '/api/posts/1',
      };

      const result = HateoasClient.parseTemplateLink(link, {});
      expect(result).toBe('/api/posts/1');
    });
  });

  describe('executeAction', () => {
    it('должен выполнить POST запрос для действия publish', async () => {
      const post: BlogPost = {
        id: 1,
        title: 'Test Post',
        content: 'Content',
        author: 'Author',
        status: 'DRAFT',
        createdAt: '2025-01-20T10:00:00Z',
        publishedAt: null,
        _links: {
          self: { href: '/api/posts/1' },
          publish: { href: '/api/posts/1/publish', type: 'POST' },
        },
      };

      const updatedPost: BlogPost = {
        ...post,
        status: 'PUBLISHED',
        publishedAt: '2025-01-20T11:00:00Z',
        _links: {
          self: { href: '/api/posts/1' },
          archive: { href: '/api/posts/1/archive', type: 'POST' },
          update: { href: '/api/posts/1', type: 'PUT' },
        },
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedPost,
      });

      const result = await HateoasClient.executeAction(post, 'publish');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts/1/publish',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Accept: 'application/hal+json',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result.status).toBe('PUBLISHED');
    });

    it('должен выбросить ошибку если действие недоступно', async () => {
      const post: BlogPost = {
        id: 1,
        title: 'Test Post',
        content: 'Content',
        author: 'Author',
        status: 'DRAFT',
        createdAt: '2025-01-20T10:00:00Z',
        publishedAt: null,
        _links: {
          self: { href: '/api/posts/1' },
        },
      };

      await expect(HateoasClient.executeAction(post, 'publish')).rejects.toThrow(
        'Action "publish" is not available'
      );
    });
  });
});
