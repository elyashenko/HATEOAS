import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dayjs from 'dayjs';
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

  const now = dayjs();

  return mockData.map((data) => {
    const createdAt = data.createdAtOffset
      ? now.add(data.createdAtOffset, 'ms').toISOString()
      : now.toISOString();
    const publishedAt =
      data.publishedAtOffset !== null && data.publishedAtOffset !== undefined
        ? now.add(data.publishedAtOffset, 'ms').toISOString()
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
