declare namespace AuthTypes {
    interface LoginCredentials {
      email: string;
      password: string;
    }
  
    interface RegisterCredentials {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      position: string;
      department?: string;
    }
  
    interface AuthResponse {
      success: boolean;
      token?: string;
      user?: UserTypes.User;
      message?: string;
    }
  
    interface ForgotPasswordRequest {
      email: string;
    }
  
    interface ResetPasswordRequest {
      token: string;
      password: string;
      confirmPassword: string;
    }
  
    interface PasswordChangeRequest {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  
    interface PasswordResponse {
      success: boolean;
      message: string;
    }
  
    interface TokenPayload {
      id: string;
      iat: number;
      exp: number;
    }
  }
  
  export = AuthTypes;