import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BlogPost, HateoasCollection } from './types';
import { HateoasClient } from './hateoas-client';
import { ActionNotAvailableError } from './types';
import { getApiBaseUrl, resolveApiUrl } from './config';

/**
 * RTK Query API для работы с постами через HATEOAS
 */
export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    headers: {
      Accept: 'application/hal+json',
      'Content-Type': 'application/json',
    },
  }),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    /**
     * Получить пост по ID
     */
    getPost: builder.query<BlogPost, number>({
      query: (id) => `/posts/${id}`,
      providesTags: (_result, _error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),

    /**
     * Получить список постов с пагинацией
     */
    listPosts: builder.query<HateoasCollection<BlogPost>, { page?: number; size?: number }>({
      query: ({ page, size }) => {
        const templateLink: { href: string; templated: boolean } = {
          href: '/posts{?page,size}',
          templated: true,
        };
        const href = HateoasClient.parseTemplateLink(templateLink, { page, size });
        return href;
      },
      providesTags: (result) => {
        if (!result?._embedded?.items) {
          return [{ type: 'Post', id: 'LIST' }];
        }
        return [
          ...result._embedded.items.map((post) => ({ type: 'Post' as const, id: post.id })),
          { type: 'Post', id: 'LIST' },
        ];
      },
    }),

    /**
     * Обновить пост
     */
    updatePost: builder.mutation<BlogPost, { id: number; data: Partial<BlogPost> }>({
      queryFn: async ({ id, data }, _api, _extraOptions, baseQuery) => {
        // Сначала получаем пост, чтобы проверить наличие ссылки update
        const getPostResult = await baseQuery(`/posts/${id}`);
        if (getPostResult.error) {
          return { error: getPostResult.error };
        }

        const post = getPostResult.data as BlogPost;
        const updateLink = HateoasClient.getLink(post, 'update');

        if (!updateLink) {
          const availableActions = HateoasClient.getAvailableActions(post);
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: new ActionNotAvailableError('update', availableActions).message,
              data: availableActions,
            },
          };
        }

        // Выполняем PUT запрос по ссылке update
        const href = resolveApiUrl(updateLink.href);

        const response = await fetch(href, {
          method: 'PUT',
          headers: {
            Accept: 'application/hal+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          return {
            error: {
              status: response.status,
              data: await response.text(),
            },
          };
        }

        const updatedPost = (await response.json()) as BlogPost;
        return { data: updatedPost };
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Post', id }],
    }),

    /**
     * Опубликовать пост
     */
    publishPost: builder.mutation<BlogPost, number>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // Получаем пост
        const getPostResult = await baseQuery(`/posts/${id}`);
        if (getPostResult.error) {
          return { error: getPostResult.error };
        }

        const post = getPostResult.data as BlogPost;

        // Выполняем действие publish через HATEOAS клиент
        try {
          const updatedPost = (await HateoasClient.executeAction(post, 'publish')) as BlogPost;
          return { data: updatedPost };
        } catch (e: unknown) {
          const err = e as Error & { status?: number; data?: string };
          if (typeof err.status === 'number') {
            return { error: { status: err.status, error: err.message, data: err.data } };
          }
          const availableActions = HateoasClient.getAvailableActions(post);
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: new ActionNotAvailableError('publish', availableActions).message,
              data: availableActions,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, id) => [{ type: 'Post', id }],
    }),

    /**
     * Архивировать пост
     */
    archivePost: builder.mutation<BlogPost, number>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        const getPostResult = await baseQuery(`/posts/${id}`);
        if (getPostResult.error) {
          return { error: getPostResult.error };
        }

        const post = getPostResult.data as BlogPost;

        try {
          const updatedPost = (await HateoasClient.executeAction(post, 'archive')) as BlogPost;
          return { data: updatedPost };
        } catch (e: unknown) {
          const err = e as Error & { status?: number; data?: string };
          if (typeof err.status === 'number') {
            return { error: { status: err.status, error: err.message, data: err.data } };
          }
          const availableActions = HateoasClient.getAvailableActions(post);
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: new ActionNotAvailableError('archive', availableActions).message,
              data: availableActions,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, id) => [{ type: 'Post', id }],
    }),

    /**
     * Переопубликовать пост (из архива)
     */
    republishPost: builder.mutation<BlogPost, number>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        const getPostResult = await baseQuery(`/posts/${id}`);
        if (getPostResult.error) {
          return { error: getPostResult.error };
        }

        const post = getPostResult.data as BlogPost;

        try {
          const updatedPost = (await HateoasClient.executeAction(post, 'republish')) as BlogPost;
          return { data: updatedPost };
        } catch (e: unknown) {
          const err = e as Error & { status?: number; data?: string };
          if (typeof err.status === 'number') {
            return { error: { status: err.status, error: err.message, data: err.data } };
          }
          const availableActions = HateoasClient.getAvailableActions(post);
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: new ActionNotAvailableError('republish', availableActions).message,
              data: availableActions,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, id) => [{ type: 'Post', id }],
    }),

    /**
     * Удалить пост
     */
    deletePost: builder.mutation<void, number>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        const getPostResult = await baseQuery(`/posts/${id}`);
        if (getPostResult.error) {
          return { error: getPostResult.error };
        }

        const post = getPostResult.data as BlogPost;
        const deleteLink = HateoasClient.getLink(post, 'delete');

        if (!deleteLink) {
          const availableActions = HateoasClient.getAvailableActions(post);
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: new ActionNotAvailableError('delete', availableActions).message,
              data: availableActions,
            },
          };
        }

        const href = resolveApiUrl(deleteLink.href);

        const response = await fetch(href, {
          method: 'DELETE',
          headers: {
            Accept: 'application/hal+json',
          },
        });

        if (!response.ok) {
          return {
            error: {
              status: response.status,
              data: await response.text(),
            },
          };
        }

        return { data: undefined };
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
  }),
});

// Экспорт хуков
export const {
  useGetPostQuery,
  useListPostsQuery,
  useUpdatePostMutation,
  usePublishPostMutation,
  useArchivePostMutation,
  useRepublishPostMutation,
  useDeletePostMutation,
} = postsApi;
