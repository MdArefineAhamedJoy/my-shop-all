import { AuthFooter } from "../../components/AuthFooter";
import { AuthFormScreen } from "../../components/AuthFormScreen";
import { useAuthDestination } from "../../hooks/useAuth";
import { CreateAccountForm } from "./CreateAccountForm";

export default function CreateAccount() {
  const returnTo = useAuthDestination();
  return (
    <AuthFormScreen
      title="Find your kind of style."
      subtitle="A few details, and your MYSHOP space is ready."
    >
      <CreateAccountForm />
      <AuthFooter
        text="Already have an account?"
        action="Sign in"
        href={{ pathname: "/login", params: { returnTo } }}
      />
    </AuthFormScreen>
  );
}
