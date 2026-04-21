import { useSyncExternalStore } from "react";

/**
 * A hook that returns true if the component is mounted on the client.
 * This is the modern, React-recommended way to handle hydration checks
 * without triggering "cascading renders" warnings from useEffect.
 */
export const useIsMounted = () => {
  return useSyncExternalStore(
    // subscribe: standard no-op as the value doesn't change after mount
    () => () => {},
    // getSnapshot: returns true on the client
    () => true,
    // getServerSnapshot: returns false on the server
    () => false,
  );
};
