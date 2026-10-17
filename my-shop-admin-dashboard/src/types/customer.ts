export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  totalOrders: number;
  totalSpent: string;
  status: "Active" | "Inactive";
}
