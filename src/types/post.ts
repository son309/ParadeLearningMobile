export type PostAuthor = {
  id: string;
  username?: string;
  avatar?: string;
  role?: string;
  online?: string;
};

export type PostVideo = {
  url: string;
  thumb?: string;
};

export type PostItem = {
  post_id: string;
  described?: string;
  created?: string;
  modified?: string;
  like?: string;
  comment?: string;
  is_liked?: string;
  video: PostVideo[];
  author?: PostAuthor;
  is_blocked?: string;
  can_comment?: string;
  can_edit?: string;
};

export type CommentItem = {
  id: string;
  comment: string;
  created?: string;
  poster: {
    id: string;
    name?: string;
    avatar?: string;
  };
};
