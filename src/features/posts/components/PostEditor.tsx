import { useState, useEffect } from 'react';
import type { BlogPost } from '../../../api/types';
import { useUpdatePostMutation } from '../../../api/postsApi';
import { useHateoasLinks } from '../hooks/useHateoasLinks';

interface PostEditorProps {
  post: BlogPost;
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * Редактор поста
 */
export function PostEditor({ post, onSave, onCancel }: PostEditorProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [updatePost, { isLoading }] = useUpdatePostMutation();
  const { canUpdate, updateLink } = useHateoasLinks(post);

  useEffect(() => {
    setTitle(post.title);
    setContent(post.content);
  }, [post]);

  const handleSave = async () => {
    if (!canUpdate || !updateLink) {
      alert('Редактирование недоступно для этого поста');
      return;
    }

    try {
      await updatePost({
        id: post.id,
        data: {
          title,
          content,
        },
        updateLink,
      }).unwrap();
      onSave?.();
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Ошибка при сохранении поста');
    }
  };

  if (!canUpdate) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">Редактирование недоступно для этого поста</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Редактирование поста</h2>

      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Заголовок
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Содержание
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isLoading || !title.trim() || !content.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}
