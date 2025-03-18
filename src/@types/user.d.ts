declare namespace UserTypes {
    interface UserBase {
      name: string;
      email: string;
      avatar?: string;
      role: 'user' | 'admin';
      department?: string;
      position: string;
      phone?: string;
      bio?: string;
      isActive: boolean;
      lastActive?: Date;
    }
  
    interface User extends UserBase {
      _id: string;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface UserCreate extends UserBase {
      password: string;
    }
  
    interface UserUpdate extends Partial<UserBase> {
      password?: string;
    }
  
    interface UserWithToken extends User {
      token: string;
    }
  
    interface NotificationSettings {
      email: boolean;
      push: boolean;
      desktop: boolean;
      types: {
        posts: boolean;
        messages: boolean;
        events: boolean;
        groups: boolean;
      };
    }
  
    interface UserProfile extends User {
      notificationSettings: NotificationSettings;
      departmentDetails?: DepartmentTypes.Department;
    }
  
    interface UserPasswordReset {
      token: string;
      password: string;
      confirmPassword: string;
    }
  
    interface UserPasswordChange {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  
    interface UserSearchParams {
      name?: string;
      email?: string;
      department?: string;
      role?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface UserListResponse {
      users: User[];
      page: number;
      pages: number;
      total: number;
    }
  }
  
  export = UserTypes;