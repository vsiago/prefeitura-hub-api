declare namespace FileTypes {
    interface FileBase {
      name: string;
      type: string;
      size: number;
      url: string;
      owner: string;
      sharedWith?: string[];
      group?: string;
      department?: string;
    }
  
    interface File extends FileBase {
      _id: string;
      extension: string;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface FileCreate extends FileBase {}
  
    interface FileUpdate extends Partial<FileBase> {}
  
    interface FileWithOwner extends File {
      ownerDetails: UserTypes.User;
    }
  
    interface FileWithSharedUsers extends FileWithOwner {
      sharedWithDetails: UserTypes.User[];
    }
  
    interface FileSearchParams {
      name?: string;
      type?: string;
      owner?: string;
      sharedWith?: string;
      group?: string;
      department?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface FileListResponse {
      files: FileWithOwner[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface FileShareResponse {
      success: boolean;
      message: string;
      sharedWith: string[];
    }
  
    interface FileUploadResponse {
      success: boolean;
      file: File;
    }
  }
  
  export = FileTypes;