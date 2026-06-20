import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    username: string;
    roleId: number;
    storeId: number;
    permissions: string[];
  };
}
