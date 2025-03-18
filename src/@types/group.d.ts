declare namespace GroupTypes {
    interface GroupBase {
      name: string;
      description: string;
      creator: string;
      avatar?: string;
      cover?: string;
      isPrivate?: boolean;
    }
  
    interface Group extends GroupBase {
      _id: string;
      members: string[];
      memberCount: number;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface GroupCreate extends GroupBase {}
  
    interface GroupUpdate extends Partial<GroupBase> {}
  
    interface GroupWithCreator extends Group {
      creatorDetails: UserTypes.User;
    }
  
    interface GroupMember {
      _id: string;
      group: string;
      user: string;
      role: 'member' | 'admin';
      joinedAt: Date;
      userDetails?: UserTypes.User;
    }
  
    interface GroupWithMembers extends GroupWithCreator {
      memberDetails: GroupMember[];
    }
  
    interface GroupSearchParams {
      name?: string;
      description?: string;
      creator?: string;
      isPrivate?: boolean;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface GroupListResponse {
      groups: GroupWithCreator[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface GroupMemberListResponse {
      members: GroupMember[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface GroupJoinResponse {
      success: boolean;
      message: string;
      group: Group;
    }
  
    interface GroupLeaveResponse {
      success: boolean;
      message: string;
    }
  }
  
  export = GroupTypes;