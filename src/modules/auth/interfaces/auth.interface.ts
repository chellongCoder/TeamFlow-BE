export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}
