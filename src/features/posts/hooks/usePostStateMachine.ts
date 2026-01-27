import { useMemo } from 'react';
import type { BlogPost } from '../../../api/types';
import { HateoasClient } from '../../../api/hateoas-client';

/**
 * Конфигурация state machine для постов
 */
const postStateMachine = {
  DRAFT: { allowedTransitions: ['publish', 'delete', 'update'] },
  PUBLISHED: { allowedTransitions: ['archive', 'update'] },
  ARCHIVED: { allowedTransitions: ['republish', 'delete'] },
} as const;

/**
 * Хук для работы с state machine поста
 */
export function usePostStateMachine(post: BlogPost | undefined) {
  return useMemo(() => {
    if (!post) {
      return {
        currentState: null,
        stateConfig: null,
        availableActions: [],
        isConsistent: false,
      };
    }

    const currentState = post.status;
    const stateConfig = postStateMachine[currentState];
    const availableActions = HateoasClient.getAvailableActions(post);

    // Проверяем консистентность: все allowedTransitions должны присутствовать в availableActions
    const isConsistent = stateConfig.allowedTransitions.every((transition) =>
      availableActions.includes(transition)
    );

    return {
      currentState,
      stateConfig,
      availableActions,
      isConsistent,
    };
  }, [post]);
}
