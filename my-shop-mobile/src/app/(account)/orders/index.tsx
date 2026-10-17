import { RequireSession } from "@/components/auth/RequireSession";
import OrdersScreen from "@/feature/(module)/orders/OrdersScreen";
export default function OrdersRoute() {
  return (
    <RequireSession destination="/orders">
      <OrdersScreen />
    </RequireSession>
  );
}
