declare namespace EventTypes {
    interface RecurringPattern {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      endDate?: Date;
    }
  
    interface EventBase {
      title: string;
      description: string;
      location?: string;
      startDate: Date;
      endDate: Date;
      creator: string;
      department?: string;
      group?: string;
      isAllDay?: boolean;
      isRecurring?: boolean;
      recurringPattern?: RecurringPattern;
      color?: string;
    }
  
    interface Event extends EventBase {
      _id: string;
      attendees: string[];
      attendeeCount: number;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface EventCreate extends EventBase {}
  
    interface EventUpdate extends Partial<EventBase> {}
  
    interface EventWithCreator extends Event {
      creatorDetails: UserTypes.User;
    }
  
    interface EventWithAttendees extends EventWithCreator {
      attendeeDetails: UserTypes.User[];
    }
  
    interface EventSearchParams {
      title?: string;
      description?: string;
      location?: string;
      startDate?: Date;
      endDate?: Date;
      creator?: string;
      department?: string;
      group?: string;
      isAllDay?: boolean;
      isRecurring?: boolean;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface EventListResponse {
      events: EventWithCreator[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface EventAttendResponse {
      success: boolean;
      message: string;
      attendees: number;
      isAttending: boolean;
    }
  }
  
  export = EventTypes;