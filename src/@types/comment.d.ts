declare namespace CommentTypes {
    interface CommentBase {
      content: string;
      author: string;
      post: string;
    }
  
    interface Comment extends CommentBase {
      _id: string;
      likes: string[];
      likeCount: number;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface CommentCreate extends CommentBase {}
  
    interface CommentUpdate extends Partial<CommentBase> {}
  
    interface CommentWithAuthor extends Comment {
      authorDetails: UserTypes.User;
    }
  
    interface CommentSearchParams {
      content?: string;
      author?: string;
      post?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface CommentListResponse {
      comments: CommentWithAuthor[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface CommentLikeResponse {
      success: boolean;
      likes: number;
      isLiked: boolean;
    }
  }
  
  export = CommentTypes;