import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dayjs from 'dayjs';
import { Post, PostStatus } from './entities/post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class PostsService {
  // In-memory хранилище (в реальном приложении использовать БД)
  private posts: Post[] = [];
  private nextId = 1;

  constructor() {
    // Инициализация мок-данными
    this.seedData();
  }

  private seedData() {
    const jsonPath = join(__dirname, 'mock-data.json');
    const hal = JSON.parse(readFileSync(jsonPath, 'utf-8')) as {
      _embedded: { items: Array<Partial<Post> & { _links?: unknown }> };
    };
    const items = hal._embedded.items;
    this.posts = items.map((item) => {
      const { _links, ...postFields } = item;
      return new Post(postFields);
    });
    this.nextId = Math.max(...this.posts.map((p) => p.id || 0)) + 1;
  }

  findAll(page: number = 1, size: number = 10): { posts: Post[]; total: number } {
    const start = (page - 1) * size;
    const end = start + size;
    const posts = this.posts.slice(start, end);
    return {
      posts,
      total: this.posts.length,
    };
  }

  findOne(id: number): Post {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundError(`Пост с ID ${id} не найден`);
    }
    return post;
  }

  create(createPostDto: CreatePostDto): Post {
    const post = new Post({
      id: this.nextId++,
      ...createPostDto,
      status: PostStatus.DRAFT,
      createdAt: dayjs().toISOString(),
      publishedAt: null,
    });
    this.posts.push(post);
    return post;
  }

  update(id: number, updatePostDto: UpdatePostDto): Post {
    const post = this.findOne(id);
    Object.assign(post, updatePostDto);
    return post;
  }

  remove(id: number): void {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundError(`Пост с ID ${id} не найден`);
    }
    this.posts.splice(index, 1);
  }

  publish(id: number): Post {
    const post = this.findOne(id);
    if (post.status !== PostStatus.DRAFT) {
      throw new Error(`Нельзя опубликовать пост со статусом ${post.status}`);
    }
    post.status = PostStatus.PUBLISHED;
    post.publishedAt = dayjs().toISOString();
    return post;
  }

  archive(id: number): Post {
    const post = this.findOne(id);
    if (post.status !== PostStatus.PUBLISHED) {
      throw new Error(`Нельзя архивировать пост со статусом ${post.status}`);
    }
    post.status = PostStatus.ARCHIVED;
    return post;
  }

  republish(id: number): Post {
    const post = this.findOne(id);
    if (post.status !== PostStatus.ARCHIVED) {
      throw new Error(`Нельзя переопубликовать пост со статусом ${post.status}`);
    }
    post.status = PostStatus.PUBLISHED;
    post.publishedAt = dayjs().toISOString();
    return post;
  }
}
