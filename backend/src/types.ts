export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at?: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
