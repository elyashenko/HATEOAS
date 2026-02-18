import { HateoasLink, PostHalResponse, PostsCollectionHalResponse } from '../interfaces/hateoas-link.interface.js';
import { Post, PostStatus } from '../../posts/entities/post.entity.js';

/**
 * Создает HAL+JSON представление поста с явными _links
 */
export function createPostHalResource(post: Post, baseUrl: string = ''): PostHalResponse {
  if (!post || !post.id) {
    throw new Error('Invalid post: post or post.id is missing');
  }

  const links: Record<string, HateoasLink> = {
    self: {
      href: `${baseUrl}/api/posts/${post.id}`,
    },
  };

  // Добавляем ссылки в зависимости от статуса
  switch (post.status) {
    case PostStatus.DRAFT:
      links.publish = {
        href: `${baseUrl}/api/posts/${post.id}/publish`,
        rel: 'publish',
        type: 'POST',
      };
      links.update = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'update',
        type: 'PATCH',
      };
      links.delete = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'delete',
        type: 'DELETE',
      };
      break;

    case PostStatus.PUBLISHED:
      links.archive = {
        href: `${baseUrl}/api/posts/${post.id}/archive`,
        rel: 'archive',
        type: 'POST',
      };
      links.update = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'update',
        type: 'PATCH',
      };
      break;

    case PostStatus.ARCHIVED:
      links.republish = {
        href: `${baseUrl}/api/posts/${post.id}/republish`,
        rel: 'republish',
        type: 'POST',
      };
      links.delete = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'delete',
        type: 'DELETE',
      };
      break;
  }

  return {
    ...post,
    _links: links,
    createdAt: post.createdAt,
    publishedAt: post.publishedAt,
  };
}

/**
 * Создает HAL+JSON коллекцию постов с явными _links и _embedded
 */
export function createPostsCollectionHalResource(
  posts: Post[],
  page: number,
  size: number,
  totalElements: number,
  baseUrl: string = '',
): PostsCollectionHalResponse {
  const totalPages = Math.ceil(totalElements / size);
  const items = posts.map((post) => createPostHalResource(post, baseUrl));

  const links: Record<string, HateoasLink> = {
    self: {
      href: `${baseUrl}/api/posts?page=${page}&size=${size}`,
      templated: false,
    },
    first: {
      href: `${baseUrl}/api/posts?page=1&size=${size}`,
      templated: false,
    },
    last: {
      href: `${baseUrl}/api/posts?page=${totalPages}&size=${size}`,
      templated: false,
    },
  };

  // Добавляем templated ссылку для пагинации
  links.templated = {
    href: `${baseUrl}/api/posts{?page,size}`,
    templated: true,
  };

  if (page > 1) {
    links.prev = {
      href: `${baseUrl}/api/posts?page=${page - 1}&size=${size}`,
      templated: false,
    };
  }

  if (page < totalPages) {
    links.next = {
      href: `${baseUrl}/api/posts?page=${page + 1}&size=${size}`,
      templated: false,
    };
  }

  return {
    _links: links,
    _embedded: {
      items,
    },
    page,
    size,
    totalElements,
    totalPages,
  };
}
