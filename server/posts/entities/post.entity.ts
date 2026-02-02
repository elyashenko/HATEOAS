export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class Post {
  id!: number;
  title!: string;
  content!: string;
  author!: string;
  status!: PostStatus;
  createdAt!: string;
  publishedAt!: string | null;

  constructor(partial: Partial<Post>) {
    Object.assign(this, partial);
  }
}
