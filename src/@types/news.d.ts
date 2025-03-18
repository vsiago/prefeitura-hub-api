declare namespace NewsTypes {
    interface NewsBase {
      title: string;
      content: string;
      summary: string;
      author: string;
      media?: string[];
      category: string;
      tags?: string[];
      isFeatured?: boolean;
      isPublished?: boolean;
      publishDate?: Date;
    }
  
    interface News extends NewsBase {
      _id: string;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface NewsCreate extends NewsBase {}
  
    interface NewsUpdate extends Partial<NewsBase> {}
  
    interface NewsWithAuthor extends News {
      authorDetails: UserTypes.User;
    }
  
    interface NewsSearchParams {
      title?: string;
      content?: string;
      summary?: string;
      author?: string;
      category?: string;
      tags?: string[];
      isFeatured?: boolean;
      isPublished?: boolean;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface NewsListResponse {
      news: NewsWithAuthor[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface NewsCategory {
      _id: string;
      name: string;
      count: number;
    }
  
    interface NewsCategoryListResponse {
      categories: NewsCategory[];
    }
  }
  
  export = NewsTypes;