/**
 * Конфигурация API
 * Определяет базовый URL для API запросов в зависимости от окружения
 */

/**
 * Получить базовый URL API
 * В продакшене использует относительные URL (same-origin)
 * В разработке использует localhost:3000
 * Можно переопределить через VITE_PROD_API_URL для тестирования с продом
 */
export function getApiBaseUrl(): string {
  // Если указан явный прод URL (для тестирования), используем его
  if (import.meta.env.VITE_PROD_API_URL) {
    return import.meta.env.VITE_PROD_API_URL;
  }

  // В продакшене используем относительные URL (same-origin)
  // Это работает, если фронтенд и бэкенд на одном домене
  if (import.meta.env.PROD) {
    // Для Vercel: если фронтенд и API на одном домене, используем относительный путь
    return '/api';
  }

  // В разработке используем localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
}

/**
 * Получить полный URL для относительных ссылок HATEOAS
 * Используется когда сервер возвращает относительные пути в _links
 */
export function resolveApiUrl(href: string): string {
  // Если ссылка уже абсолютная (начинается с http), возвращаем как есть
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }

  // В продакшене используем new URL() для правильного разрешения относительных путей
  // Пути, начинающиеся с /, разрешаются относительно origin
  if (import.meta.env.PROD) {
    if (typeof window !== 'undefined') {
      // Используем new URL() для правильного разрешения относительных путей
      // Это гарантирует, что пути, начинающиеся с /, разрешаются относительно origin
      return new URL(href, window.location.origin).href;
    }
    // На сервере (SSR) возвращаем как есть
    return href;
  }

  // В разработке добавляем базовый URL
  // Если указан прод URL для тестирования, используем его
  if (import.meta.env.VITE_PROD_API_URL) {
    const prodBaseUrl = import.meta.env.VITE_PROD_API_URL.replace(/\/api$/, '');
    return `${prodBaseUrl}${href}`;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}${href}`;
}
