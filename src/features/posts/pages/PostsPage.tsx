import { PostList } from '../components/PostList';

/**
 * Страница со списком постов
 */
export function PostsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Блог посты</h1>
      <PostList />
    </div>
  );
}
