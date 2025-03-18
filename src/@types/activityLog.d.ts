declare namespace ActivityLogTypes {
    type ActionType = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'download' | 'upload' | 'share' | 'other';
    type EntityType = 'user' | 'post' | 'comment' | 'group' | 'chat' | 'message' | 'event' | 'news' | 'file' | 'department' | 'system';
  
    interface Entity {
      type: EntityType;
      id: string;
    }
  
    interface ActivityLogBase {
      user: string;
      action: ActionType;
      entity: Entity;
      details?: string;
      ip?: string;
      userAgent?: string;
    }
  
    interface ActivityLog extends ActivityLogBase {
      _id: string;
      createdAt: Date;
    }
  
    interface ActivityLogCreate extends ActivityLogBase {}
  
    interface ActivityLogWithUser extends ActivityLog {
      userDetails: UserTypes.User;
    }
  
    interface ActivityLogWithEntity extends ActivityLogWithUser {
      entityDetails?: any; // Pode ser qualquer tipo de entidade
    }
  
    interface ActivityLogSearchParams {
      user?: string;
      action?: ActionType;
      entityType?: EntityType;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface ActivityLogListResponse {
      logs: ActivityLogWithUser[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface ActivityLogStats {
      totalLogs: number;
      actionCounts: Record<ActionType, number>;
      entityCounts: Record<EntityType, number>;
      userCounts: {
        userId: string;
        userName: string;
        count: number;
      }[];
      dailyActivity: {
        date: string;
        count: number;
      }[];
    }
  }
  
  export = ActivityLogTypes;