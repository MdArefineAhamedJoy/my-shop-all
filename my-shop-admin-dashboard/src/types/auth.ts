export type Role = "Admin" | "Staff" | "Customer";

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
}
