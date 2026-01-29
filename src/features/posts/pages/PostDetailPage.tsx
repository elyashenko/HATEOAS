import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPostQuery } from '../../../api/postsApi';
import { PostCard } from '../components/PostCard';
import { PostEditor } from '../components/PostEditor';
import { formatError } from '../../../shared/utils/errorFormatter';

/**
 * Страница детального просмотра поста
 */
export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { data: post, isLoading, error } = useGetPostQuery(Number(id));

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-lg text-gray-600">Загрузка поста...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    const errorMessage = error ? formatError(error) : 'Пост не найден';
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12">
          <div className="text-lg text-red-600 mb-4">
            Ошибка загрузки поста: {errorMessage}
          </div>
          {error && (
            <div className="text-sm text-gray-500 mb-4">
              Проверьте, что server API доступен и настроен правильно
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        ← Назад к списку
      </button>

      {isEditing ? (
        <PostEditor
          post={post}
          onSave={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <PostCard post={post} onEditClick={() => setIsEditing(true)} />
        </>
      )}
    </div>
  );
}
