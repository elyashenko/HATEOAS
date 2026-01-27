import type { BlogPost, HateoasCollection } from '../types';

/**
 * Моки для тестирования
 */

export const mockBlogPostDraft: BlogPost = {
  id: 1,
  title: 'Черновик поста',
  content: 'Содержание черновика',
  author: 'Иван Петров',
  status: 'DRAFT',
  createdAt: '2025-01-20T10:00:00Z',
  publishedAt: null,
  _links: {
    self: { href: '/api/posts/1', type: 'application/hal+json' },
    publish: { href: '/api/posts/1/publish', rel: 'publish', method: 'POST' },
    update: { href: '/api/posts/1', rel: 'update', method: 'PUT' },
    delete: { href: '/api/posts/1', rel: 'delete', method: 'DELETE' },
  },
};

export const mockBlogPostPublished: BlogPost = {
  id: 2,
  title: 'Опубликованный пост',
  content: 'Содержание опубликованного поста',
  author: 'Иван Петров',
  status: 'PUBLISHED',
  createdAt: '2025-01-20T10:00:00Z',
  publishedAt: '2025-01-20T11:00:00Z',
  _links: {
    self: { href: '/api/posts/2', type: 'application/hal+json' },
    archive: { href: '/api/posts/2/archive', rel: 'archive', method: 'POST' },
    update: { href: '/api/posts/2', rel: 'update', method: 'PUT' },
  },
};

export const mockBlogPostArchived: BlogPost = {
  id: 3,
  title: 'Архивированный пост',
  content: 'Содержание архивированного поста',
  author: 'Иван Петров',
  status: 'ARCHIVED',
  createdAt: '2025-01-20T10:00:00Z',
  publishedAt: '2025-01-20T11:00:00Z',
  _links: {
    self: { href: '/api/posts/3', type: 'application/hal+json' },
    republish: { href: '/api/posts/3/republish', rel: 'republish', method: 'POST' },
    delete: { href: '/api/posts/3', rel: 'delete', method: 'DELETE' },
  },
};

export const mockPostsCollection: HateoasCollection<BlogPost> = {
  _links: {
    self: { href: '/api/posts?page=1&size=10', templated: false },
    next: { href: '/api/posts?page=2&size=10', templated: false },
    first: { href: '/api/posts?page=1&size=10', templated: false },
    last: { href: '/api/posts?page=5&size=10', templated: false },
  },
  _embedded: {
    items: [mockBlogPostDraft, mockBlogPostPublished],
  },
  page: 1,
  size: 10,
  totalElements: 50,
  totalPages: 5,
};
