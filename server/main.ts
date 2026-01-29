import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { PostsService } from './posts/posts.service.js';
import { NotFoundError } from './posts/posts.service.js';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePostDto } from './posts/dto/create-post.dto.js';
import { UpdatePostDto } from './posts/dto/update-post.dto.js';
import { PaginationQueryDto } from './posts/dto/pagination-query.dto.js';
import { createPostHalResource, createPostsCollectionHalResource } from './common/utils/hateoas.util.js';

// Функция для создания и настройки Fastify приложения
export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  });

// Глобальный обработчик ошибок
fastify.setErrorHandler((error, request, reply) => {
  // Логируем ошибку для диагностики
  fastify.log.error({
    err: error,
    url: request.url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    query: request.query,
    params: request.params,
  }, 'Unhandled error occurred');

  // Определяем статус код в зависимости от типа ошибки
  let statusCode = 500;
  if (error instanceof NotFoundError) {
    statusCode = 404;
  } else if ((error as any).statusCode) {
    statusCode = (error as any).statusCode;
  } else if ((error as any).status) {
    statusCode = (error as any).status;
  }
  
  // Формируем ответ с ошибкой в формате, который ожидает клиент
  const errorResponse: { error: { code: string; message: string; details?: unknown } } = {
    error: {
      code: String(statusCode),
      message: error.message || 'A server error has occurred',
    },
  };

  // В режиме разработки добавляем детали ошибки
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.details = {
      name: error.name,
      stack: error.stack,
    };
  }

  return reply.code(statusCode).send(errorResponse);
});

// Регистрация CORS
fastify.register(cors, {
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://hateoas.vercel.app',
      // Разрешаем все поддомены vercel.app для продакшена
      /^https:\/\/.*\.vercel\.app$/,
    ];

    // Проверяем, соответствует ли origin одному из разрешенных
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});

// Инициализация сервиса
const postsService = new PostsService();

// Вспомогательная функция для валидации DTO
async function validateDto<T extends object>(
  DtoClass: new () => T,
  data: unknown,
): Promise<{ isValid: boolean; dto?: T; errors?: string[] }> {
  const dto = plainToInstance(DtoClass, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    const errorMessages = errors.flatMap((error) =>
      Object.values(error.constraints || {}),
    );
    return { isValid: false, errors: errorMessages };
  }

  return { isValid: true, dto };
}

// Роуты для постов
fastify.post('/api/posts', async (request, reply) => {
  try {
    const validation = await validateDto(CreatePostDto, request.body);
    if (!validation.isValid) {
      return reply.code(400).send({ errors: validation.errors });
    }

    const post = postsService.create(validation.dto!);
    const halResource = createPostHalResource(post);
    return reply.code(201).type('application/hal+json').send(halResource);
  } catch (error) {
    fastify.log.error({ err: error, body: request.body }, 'Error creating post');
    throw error; // Передаем ошибку в глобальный обработчик
  }
});

fastify.get('/api/posts', async (request, reply) => {
  try {
    const validation = await validateDto(PaginationQueryDto, request.query);
    if (!validation.isValid) {
      return reply.code(400).send({ errors: validation.errors });
    }

    const page = validation.dto?.page || 1;
    const size = validation.dto?.size || 10;
    const { posts, total } = postsService.findAll(page, size);
    const halResource = createPostsCollectionHalResource(posts, page, size, total);
    return reply.type('application/hal+json').send(halResource);
  } catch (error) {
    fastify.log.error({ err: error, query: request.query }, 'Error fetching posts');
    throw error; // Передаем ошибку в глобальный обработчик
  }
});

fastify.get('/api/posts/:id', async (request, reply) => {
  const id = parseInt((request.params as { id: string }).id, 10);
  if (isNaN(id)) {
    return reply.code(400).send({ error: 'Invalid post ID' });
  }

  try {
    const post = postsService.findOne(id);
    const halResource = createPostHalResource(post);
    return reply.type('application/hal+json').send(halResource);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    throw error;
  }
});

fastify.put('/api/posts/:id', async (request, reply) => {
  const id = parseInt((request.params as { id: string }).id, 10);
  if (isNaN(id)) {
    return reply.code(400).send({ error: 'Invalid post ID' });
  }

  const validation = await validateDto(UpdatePostDto, request.body);
  if (!validation.isValid) {
    return reply.code(400).send({ errors: validation.errors });
  }

  try {
    const post = postsService.update(id, validation.dto!);
    const halResource = createPostHalResource(post);
    return reply.type('application/hal+json').send(halResource);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    throw error;
  }
});

fastify.delete('/api/posts/:id', async (request, reply) => {
  const id = parseInt((request.params as { id: string }).id, 10);
  if (isNaN(id)) {
    return reply.code(400).send({ error: 'Invalid post ID' });
  }

  try {
    postsService.remove(id);
    return reply.code(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    throw error;
  }
});

fastify.post('/api/posts/:id/publish', async (request, reply) => {
  const id = parseInt((request.params as { id: string }).id, 10);
  if (isNaN(id)) {
    return reply.code(400).send({ error: 'Invalid post ID' });
  }

  try {
    const post = postsService.publish(id);
    const halResource = createPostHalResource(post);
    return reply.type('application/hal+json').send(halResource);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

fastify.post('/api/posts/:id/archive', async (request, reply) => {
  const id = parseInt((request.params as { id: string }).id, 10);
  if (isNaN(id)) {
    return reply.code(400).send({ error: 'Invalid post ID' });
  }

  try {
    const post = postsService.archive(id);
    const halResource = createPostHalResource(post);
    return reply.type('application/hal+json').send(halResource);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

fastify.post('/api/posts/:id/republish', async (request, reply) => {
  const id = parseInt((request.params as { id: string }).id, 10);
  if (isNaN(id)) {
    return reply.code(400).send({ error: 'Invalid post ID' });
  }

  try {
    const post = postsService.republish(id);
    const halResource = createPostHalResource(post);
    return reply.type('application/hal+json').send(halResource);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

  return fastify;
}

// Запуск сервера (только для локальной разработки)
async function bootstrap() {
  try {
    const app = await buildApp();
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server запущен на http://localhost:3000/api');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Запускаем сервер только если файл запущен напрямую (не импортирован)
// Проверяем, что мы не в serverless окружении Vercel
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  bootstrap();
}
