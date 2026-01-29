import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

/**
 * Форматирует ошибку RTK Query в читаемое сообщение
 */
export function formatError(error: unknown): string {
  if (!error) {
    return 'Неизвестная ошибка';
  }

  // Если это стандартная ошибка Error
  if (error instanceof Error) {
    return error.message;
  }

  // Если это FetchBaseQueryError от RTK Query
  if (typeof error === 'object' && 'status' in error) {
    const fetchError = error as FetchBaseQueryError;

    // Ошибка сети (сервер недоступен, CORS и т.д.)
    if (fetchError.status === 'FETCH_ERROR') {
      const message = (fetchError.error as string) || 'Ошибка сети';
      if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('CORS')) {
        return 'Не удалось подключиться к серверу API. Проверьте настройки сети и CORS.';
      }
      return `Ошибка сети: ${message}`;
    }

    // Ошибка парсинга ответа
    if (fetchError.status === 'PARSING_ERROR') {
      return `Ошибка парсинга ответа: ${(fetchError.error as string) || 'Неверный формат данных'}`;
    }

    // Кастомная ошибка
    if (fetchError.status === 'CUSTOM_ERROR') {
      return (fetchError.error as string) || 'Неизвестная ошибка';
    }

    // HTTP ошибка
    if (typeof fetchError.status === 'number') {
      const status = fetchError.status;
      const data = fetchError.data;

      // Попытка извлечь сообщение из данных
      let message = '';
      if (typeof data === 'string') {
        message = data;
      } else if (data && typeof data === 'object' && 'message' in data) {
        message = String(data.message);
      } else if (data && typeof data === 'object' && 'error' in data) {
        message = String(data.error);
      }

      // Стандартные сообщения для HTTP статусов
      const statusMessages: Record<number, string> = {
        400: 'Неверный запрос',
        401: 'Требуется авторизация',
        403: 'Доступ запрещен',
        404: 'Ресурс не найден',
        500: 'Внутренняя ошибка сервера',
        502: 'Сервер недоступен',
        503: 'Сервис временно недоступен',
      };

      const statusMessage = statusMessages[status] || `HTTP ошибка ${status}`;
      return message ? `${statusMessage}: ${message}` : statusMessage;
    }
  }

  // Если это строка
  if (typeof error === 'string') {
    return error;
  }

  // В остальных случаях
  return 'Неизвестная ошибка';
}
