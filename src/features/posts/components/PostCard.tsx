import dayjs from 'dayjs';
import type { BlogPost } from '../../../api/types';
import { useHateoasLinks } from '../hooks/useHateoasLinks';
import {
  usePublishPostMutation,
  useArchivePostMutation,
  useDeletePostMutation,
} from '../../../api/postsApi';
import { HateoasButton } from '../../../shared/components/HateoasButton';

interface PostCardProps {
  post: BlogPost;
  onEditClick?: () => void;
}

/**
 * Карточка поста с действиями на основе HATEOAS ссылок
 */
export function PostCard({ post, onEditClick }: PostCardProps) {
  const { canPublish, canArchive, canUpdate, canDelete, publishLink, archiveLink, updateLink, deleteLink } =
    useHateoasLinks(post);

  const [publishPost, { isLoading: isPublishing }] = usePublishPostMutation();
  const [archivePost, { isLoading: isArchiving }] = useArchivePostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  const handlePublish = async () => {
    try {
      await publishPost(post.id).unwrap();
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await archivePost(post.id).unwrap();
    } catch (error) {
      console.error('Failed to archive post:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
      try {
        await deletePost(post.id).unwrap();
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const statusColors = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликован',
    ARCHIVED: 'Архивирован',
  };

  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[post.status]}`}>
          {statusLabels[post.status]}
        </span>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>

      <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
        <span>Автор: {post.author}</span>
        <span>
          Создан: {dayjs(post.createdAt).format('DD.MM.YYYY')}
          {post.publishedAt && (
            <> | Опубликован: {dayjs(post.publishedAt).format('DD.MM.YYYY')}</>
          )}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {canUpdate && (
          <HateoasButton link={updateLink} onClick={onEditClick || (() => {})} variant="secondary">
            Редактировать
          </HateoasButton>
        )}

        {canPublish && (
          <HateoasButton
            link={publishLink}
            onClick={handlePublish}
            disabled={isPublishing}
            variant="primary"
          >
            {isPublishing ? 'Публикация...' : 'Опубликовать'}
          </HateoasButton>
        )}

        {canArchive && (
          <HateoasButton
            link={archiveLink}
            onClick={handleArchive}
            disabled={isArchiving}
            variant="secondary"
          >
            {isArchiving ? 'Архивирование...' : 'Архивировать'}
          </HateoasButton>
        )}

        {canDelete && (
          <HateoasButton
            link={deleteLink}
            onClick={handleDelete}
            disabled={isDeleting}
            variant="danger"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </HateoasButton>
        )}
      </div>
    </div>
  );
}
