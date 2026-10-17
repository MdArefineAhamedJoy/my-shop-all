const authDestinations = [
  "/profile",
  "/orders",
  "/addresses",
  "/checkout",
  "/account",
] as const;
export function resolveAuthDestination(value: string | string[] | undefined) {
  return (
    authDestinations.find((destination) => destination === value) || "/account"
  );
}
