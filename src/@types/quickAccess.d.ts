declare namespace QuickAccessTypes {
    interface QuickAccessBase {
      name: string;
      icon: string;
      url: string;
      category?: string;
      user: string;
      order?: number;
      isCustom?: boolean;
    }
  
    interface QuickAccess extends QuickAccessBase {
      _id: string;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface QuickAccessCreate extends Omit<QuickAccessBase, 'user'> {}
  
    interface QuickAccessUpdate extends Partial<Omit<QuickAccessBase, 'user'>> {}
  
    interface QuickAccessWithUser extends QuickAccess {
      userDetails: UserTypes.User;
    }
  
    interface QuickAccessSearchParams {
      name?: string;
      category?: string;
      user?: string;
      isCustom?: boolean;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface QuickAccessListResponse {
      apps: QuickAccess[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface QuickAccessGalleryItem {
      _id: string;
      name: string;
      icon: string;
      url: string;
      category: string;
      description?: string;
      isPopular?: boolean;
    }
  
    interface QuickAccessGalleryResponse {
      apps: QuickAccessGalleryItem[];
      categories: string[];
    }
  
    interface QuickAccessOrderUpdate {
      appIds: string[];
    }
  
    interface QuickAccessOrderResponse {
      success: boolean;
      message: string;
      apps: QuickAccess[];
    }
  }
  
  export = QuickAccessTypes;