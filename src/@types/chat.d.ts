declare namespace ChatTypes {
    interface ChatBase {
      participants: string[];
      isGroup?: boolean;
      name?: string;
    }
  
    interface Chat extends ChatBase {
      _id: string;
      lastMessage?: string;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface ChatCreate extends ChatBase {}
  
    interface ChatUpdate extends Partial<ChatBase> {}
  
    interface ChatWithParticipants extends Chat {
      participantDetails: UserTypes.User[];
      lastMessageDetails?: Message;
    }
  
    interface MessageBase {
      chat: string;
      sender: string;
      content?: string;
      media?: string[];
    }
  
    interface Message extends MessageBase {
      _id: string;
      readBy: string[];
      isEdited: boolean;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface MessageCreate extends MessageBase {}
  
    interface MessageUpdate extends Partial<MessageBase> {}
  
    interface MessageWithSender extends Message {
      senderDetails: UserTypes.User;
    }
  
    interface ChatSearchParams {
      participant?: string;
      isGroup?: boolean;
      name?: string;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface MessageSearchParams {
      chat: string;
      sender?: string;
      content?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface ChatListResponse {
      chats: ChatWithParticipants[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface MessageListResponse {
      messages: MessageWithSender[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface MessageReadResponse {
      success: boolean;
      message: string;
      readBy: string[];
    }
  }
  
  export = ChatTypes;