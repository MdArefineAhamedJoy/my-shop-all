import { RequireSession } from "@/components/auth/RequireSession";
import AddressesScreen from "@/feature/(module)/account/AddressesScreen";
export default function AddressesRoute() {
  return (
    <RequireSession destination="/addresses">
      <AddressesScreen />
    </RequireSession>
  );
}
