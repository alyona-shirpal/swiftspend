import { Request } from 'express';

export interface AuthUser {
  id: string;
  email?: string;
  created_at?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
