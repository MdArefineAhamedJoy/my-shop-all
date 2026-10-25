import { User } from "../modules/users/entities/user.entity";
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user: User;
      sessionId: string;
    }
  }
}
export {};
