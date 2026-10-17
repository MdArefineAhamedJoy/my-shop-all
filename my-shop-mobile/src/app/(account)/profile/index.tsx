import { RequireSession } from "@/components/auth/RequireSession";
import ProfileScreen from "@/feature/(module)/account/ProfileScreen";
export default function ProfileRoute() {
  return (
    <RequireSession destination="/profile">
      <ProfileScreen />
    </RequireSession>
  );
}
