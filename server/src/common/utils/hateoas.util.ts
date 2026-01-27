import { HateoasLink, HateoasResource, HateoasCollection } from '../interfaces/hateoas-link.interface';
import { Post, PostStatus } from '../../posts/entities/post.entity';

/**
 * Создает HAL+JSON представление поста с HATEOAS ссылками
 */
export function createPostHalResource(post: Post, baseUrl: string = ''): Post & HateoasResource {
  const links: Record<string, HateoasLink> = {
    self: {
      href: `${baseUrl}/api/posts/${post.id}`,
      type: 'application/hal+json',
    },
  };

  // Добавляем ссылки в зависимости от статуса
  switch (post.status) {
    case PostStatus.DRAFT:
      links.publish = {
        href: `${baseUrl}/api/posts/${post.id}/publish`,
        rel: 'publish',
        method: 'POST',
      };
      links.update = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'update',
        method: 'PUT',
      };
      links.delete = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'delete',
        method: 'DELETE',
      };
      break;

    case PostStatus.PUBLISHED:
      links.archive = {
        href: `${baseUrl}/api/posts/${post.id}/archive`,
        rel: 'archive',
        method: 'POST',
      };
      links.update = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'update',
        method: 'PUT',
      };
      break;

    case PostStatus.ARCHIVED:
      links.republish = {
        href: `${baseUrl}/api/posts/${post.id}/republish`,
        rel: 'republish',
        method: 'POST',
      };
      links.delete = {
        href: `${baseUrl}/api/posts/${post.id}`,
        rel: 'delete',
        method: 'DELETE',
      };
      break;
  }

  return {
    ...post,
    _links: links,
    createdAt: post.createdAt.toISOString(),
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  };
}

/**
 * Создает HAL+JSON коллекцию постов с пагинацией
 */
export function createPostsCollectionHalResource(
  posts: Post[],
  page: number,
  size: number,
  totalElements: number,
  baseUrl: string = '',
): HateoasCollection<Post & HateoasResource> {
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
