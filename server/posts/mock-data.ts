import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Post, PostStatus } from './entities/post.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Интерфейс для данных из JSON файла
 */
interface MockPostData {
  id: number;
  title: string;
  content: string;
  author: string;
  status: string;
  createdAtOffset?: number;
  publishedAtOffset?: number | null;
}

/**
 * Мок-данные для постов
 * Загружаются из JSON файла и преобразуются в объекты Post
 */
export function getMockPosts(): Partial<Post>[] {
  const jsonPath = join(__dirname, 'mock-data.json');
  const jsonData = readFileSync(jsonPath, 'utf-8');
  const mockData: MockPostData[] = JSON.parse(jsonData);

  const now = new Date();

  return mockData.map((data) => {
    const createdAt = data.createdAtOffset
      ? new Date(now.getTime() + data.createdAtOffset)
      : now;
    const publishedAt =
      data.publishedAtOffset !== null && data.publishedAtOffset !== undefined
        ? new Date(now.getTime() + data.publishedAtOffset)
        : null;

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      author: data.author,
      status: data.status as PostStatus,
      createdAt,
      publishedAt,
    };
  });
}
