declare namespace DepartmentTypes {
    interface DepartmentBase {
      name: string;
      description: string;
      head?: string;
      parent?: string;
      color?: string;
      icon?: string;
    }
  
    interface Department extends DepartmentBase {
      _id: string;
      createdAt: Date;
      updatedAt?: Date;
    }
  
    interface DepartmentCreate extends DepartmentBase {}
  
    interface DepartmentUpdate extends Partial<DepartmentBase> {}
  
    interface DepartmentWithHead extends Department {
      headDetails?: UserTypes.User;
    }
  
    interface DepartmentWithParent extends DepartmentWithHead {
      parentDetails?: Department;
    }
  
    interface DepartmentWithChildren extends DepartmentWithParent {
      children: Department[];
    }
  
    interface DepartmentSearchParams {
      name?: string;
      description?: string;
      head?: string;
      parent?: string;
      page?: number;
      limit?: number;
      sort?: string;
    }
  
    interface DepartmentListResponse {
      departments: DepartmentWithHead[];
      page: number;
      pages: number;
      total: number;
    }
  
    interface DepartmentTreeResponse {
      departments: DepartmentWithChildren[];
    }
  }
  
  export = DepartmentTypes;