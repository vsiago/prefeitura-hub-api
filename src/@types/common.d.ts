declare namespace CommonTypes {
    interface PaginationParams {
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface PaginationResult<T> {
      data: T[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface ApiResponse<T = any> {
      success: boolean;
      data?: T;
      message?: string;
      error?: string;
    }
  
    interface ErrorResponse {
      success: false;
      error: string;
      stack?: string;
    }
  
    interface SuccessResponse<T = any> {
      success: true;
      data: T;
      message?: string;
    }
  
    interface FileUploadOptions {
      fieldName: string;
      maxSize: number;
      allowedTypes: string[];
      path: string;
    }
  
    interface SearchQuery {
      [key: string]: any;
    }
  
    interface SortOptions {
      [key: string]: 1 | -1;
    }
  
    interface DateRange {
      startDate?: Date;
      endDate?: Date;
    }
  
    interface SelectFields {
      [key: string]: 0 | 1;
    }
  
    interface PopulateOptions {
      path: string;
      select?: string;
      model?: string;
      match?: any;
      options?: any;
      populate?: PopulateOptions | PopulateOptions[];
    }
  
    interface QueryOptions {
      sort?: SortOptions;
      page?: number;
      limit?: number;
      select?: SelectFields | string;
      populate?: PopulateOptions | PopulateOptions[];
    }
  }
  
  export = CommonTypes;