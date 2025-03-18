declare namespace PostTypes {
    interface PostBase {
      title?: string;
      content: string;
      author: string;
      media?: string[];
      group?: string;
      department?: string;
      tags?: string[];
      isPublished?: boolean;
      publishDate?: Date;
    }
  
    interface Post extends PostBase {
      _id: string;
      likes: string[];
      comments: string[];
      likeCount: number;
      commentCount: number;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface PostCreate extends PostBase {}
  
    interface PostUpdate extends Partial<PostBase> {}
  
    interface PostWithAuthor extends Post {
      authorDetails: UserTypes.User;
    }
  
    interface PostWithComments extends PostWithAuthor {
      commentDetails: CommentTypes.CommentWithAuthor[];
    }
  
    interface PostSearchParams {
      title?: string;
      content?: string;
      author?: string;
      group?: string;
      department?: string;
      tags?: string[];
      isPublished?: boolean;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface PostListResponse {
      posts: PostWithAuthor[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface PostLikeResponse {
      success: boolean;
      likes: number;
      isLiked: boolean;
    }
  }
  
  export = PostTypes;