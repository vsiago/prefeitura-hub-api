declare namespace NotificationTypes {
    type NotificationType = 'post' | 'comment' | 'like' | 'message' | 'event' | 'group' | 'file' | 'news' | 'system';
    type RelatedEntityType = 'post' | 'comment' | 'chat' | 'event' | 'group' | 'file' | 'news' | 'user';
  
    interface RelatedEntity {
      type: RelatedEntityType;
      id: string;
    }
  
    interface NotificationBase {
      recipient: string;
      type: NotificationType;
      content: string;
      relatedTo: RelatedEntity;
    }
  
    interface Notification extends NotificationBase {
      _id: string;
      isRead: boolean;
      createdAt: Date;
    }
  
    interface NotificationCreate extends NotificationBase {}
  
    interface NotificationUpdate {
      isRead?: boolean;
    }
  
    interface NotificationWithDetails extends Notification {
      recipientDetails: UserTypes.User;
      relatedEntity?: any; // Pode ser qualquer tipo de entidade relacionada
    }
  
    interface NotificationSearchParams {
      recipient?: string;
      type?: NotificationType;
      isRead?: boolean;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface NotificationListResponse {
      notifications: NotificationWithDetails[];
      page: number;
      pages: number;
      total: number;
      unreadCount: number;
    }
  
    interface NotificationMarkReadResponse {
      success: boolean;
      message: string;
      unreadCount: number;
    }
  }
  
  export = NotificationTypes;