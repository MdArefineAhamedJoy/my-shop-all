export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
export interface PreviewSession {
  mode: "preview";
  user: UserProfile;
}
export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput extends LoginInput {
  name: string;
  confirmPassword: string;
}
export interface ResetChallenge {
  email: string;
  id: string;
  expiresAt: number;
  verified: boolean;
}
export interface AuthService {
  login(input: LoginInput): Promise<PreviewSession>;
  register(input: RegisterInput): Promise<PreviewSession>;
  requestReset(email: string): Promise<ResetChallenge>;
  verifyCode(challenge: ResetChallenge, code: string): Promise<ResetChallenge>;
  resetPassword(challenge: ResetChallenge, password: string): Promise<void>;
}
