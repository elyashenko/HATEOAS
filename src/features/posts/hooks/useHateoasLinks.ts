import { useMemo } from 'react';
import type { BlogPost } from '../../../api/types';
import { HateoasClient } from '../../../api/hateoas-client';

/**
 * Хук для работы со ссылками HATEOAS поста
 */
export function useHateoasLinks(post: BlogPost | undefined) {
  return useMemo(() => {
    if (!post) {
      return {
        canPublish: false,
        canArchive: false,
        canUpdate: false,
        canDelete: false,
        canRepublish: false,
        publishLink: null,
        archiveLink: null,
        updateLink: null,
        deleteLink: null,
        republishLink: null,
        allActions: [],
      };
    }

    const canPublish = HateoasClient.hasLink(post, 'publish');
    const canArchive = HateoasClient.hasLink(post, 'archive');
    const canUpdate = HateoasClient.hasLink(post, 'update');
    const canDelete = HateoasClient.hasLink(post, 'delete');
    const canRepublish = HateoasClient.hasLink(post, 'republish');

    const publishLink = HateoasClient.getLink(post, 'publish');
    const archiveLink = HateoasClient.getLink(post, 'archive');
    const updateLink = HateoasClient.getLink(post, 'update');
    const deleteLink = HateoasClient.getLink(post, 'delete');
    const republishLink = HateoasClient.getLink(post, 'republish');

    const allActions = HateoasClient.getAvailableActions(post);

    return {
      canPublish,
      canArchive,
      canUpdate,
      canDelete,
      canRepublish,
      publishLink,
      archiveLink,
      updateLink,
      deleteLink,
      republishLink,
      allActions,
    };
  }, [post]);
}
