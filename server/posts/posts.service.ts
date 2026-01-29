import { Post, PostStatus } from './entities/post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

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
    // Инициализация тестовыми данными
    this.seedData();
  }

  private seedData() {
    const now = new Date();
    const publishedDate = new Date(now.getTime() - 86400000); // день назад

    this.posts = [
      new Post({
        id: this.nextId++,
        title: 'Как использовать HATEOAS',
        content: 'HATEOAS (Hypermedia as the Engine of Application State) — это архитектурный стиль REST API, который позволяет клиенту динамически навигироваться по API через гипермедиа-ссылки.',
        author: 'Иван Петров',
        status: PostStatus.DRAFT,
        createdAt: now,
        publishedAt: null,
      }),
      new Post({
        id: this.nextId++,
        title: 'Преимущества HAL+JSON',
        content: 'HAL (Hypertext Application Language) — это простой формат для представления гипермедиа ресурсов. Он позволяет легко добавлять ссылки и встроенные ресурсы.',
        author: 'Мария Иванова',
        status: PostStatus.PUBLISHED,
        createdAt: publishedDate,
        publishedAt: publishedDate,
      }),
      new Post({
        id: this.nextId++,
        title: 'Архитектура REST API',
        content: 'REST API должен быть stateless, использовать стандартные HTTP методы и коды ответов, а также поддерживать кэширование.',
        author: 'Алексей Сидоров',
        status: PostStatus.ARCHIVED,
        createdAt: new Date(now.getTime() - 172800000), // 2 дня назад
        publishedAt: publishedDate,
      }),
    ];
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
      createdAt: new Date(),
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
    post.publishedAt = new Date();
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
    post.publishedAt = new Date();
    return post;
  }
}
