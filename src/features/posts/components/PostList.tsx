import { useState } from 'react';
import { useListPostsQuery } from '../../../api/postsApi';
import { PostCard } from './PostCard';
import { HateoasClient } from '../../../api/hateoas-client';
import type { HateoasCollection, BlogPost } from '../../../api/types';
import { formatError } from '../../../shared/utils/errorFormatter';

/**
 * Список постов с пагинацией на основе HATEOAS ссылок
 */
export function PostList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useListPostsQuery({ page, size: 10 });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Загрузка постов...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage = formatError(error);
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="text-lg text-red-600 mb-4">
          Ошибка загрузки постов: {errorMessage}
        </div>
        <div className="text-sm text-gray-500">
          Проверьте, что server API запущен на http://localhost:3000/api
        </div>
      </div>
    );
  }

  if (!data?._embedded?.items || data._embedded.items.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Постов пока нет</div>
      </div>
    );
  }

  const collection = data as HateoasCollection<BlogPost>;
  const hasNextPage = HateoasClient.hasLink(collection, 'next');
  const hasPrevPage = HateoasClient.hasLink(collection, 'prev');

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setPage((prev) => Math.max(1, prev - 1));
    }
  };

  return (
    <div>
      <div className="space-y-4 mb-6">
        {data._embedded.items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Страница {page}
          {collection.totalPages && ` из ${collection.totalPages}`}
          {collection.totalElements && ` (всего: ${collection.totalElements})`}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              hasPrevPage
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Предыдущая
          </button>
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              hasNextPage
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Следующая
          </button>
        </div>
      </div>
    </div>
  );
}
