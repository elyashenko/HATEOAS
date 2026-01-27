import { useCallback } from 'react';
import type { BlogPost, HateoasResource } from '../../../api/types';
import { HateoasClient } from '../../../api/hateoas-client';
import { ActionNotAvailableError } from '../../../api/types';

/**
 * Хук для выполнения действий над постом через HATEOAS
 */
export function usePostActions(post: BlogPost | undefined) {
  const executeAction = useCallback(
    async (action: string, payload?: unknown): Promise<HateoasResource> => {
      if (!post) {
        throw new Error('Post is not available');
      }

      const hasAction = HateoasClient.hasLink(post, action);
      if (!hasAction) {
        const availableActions = HateoasClient.getAvailableActions(post);
        throw new ActionNotAvailableError(action, availableActions);
      }

      return await HateoasClient.executeAction(post, action, payload);
    },
    [post]
  );

  return { executeAction };
}
