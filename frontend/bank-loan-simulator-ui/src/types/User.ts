export interface User {
  id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  token: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}
