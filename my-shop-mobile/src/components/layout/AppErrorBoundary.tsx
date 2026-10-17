import { Component, type PropsWithChildren } from "react";
import { Button, EmptyState } from "@/components/ui";
import { Screen } from "./Screen";

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <Screen>
          <EmptyState
            icon="refresh-outline"
            title="Let's try that again"
            description="This screen could not be displayed. Your saved shopping data is still on this device."
          />
          <Button
            title="Try again"
            onPress={() => this.setState({ failed: false })}
          />
        </Screen>
      );
    return this.props.children;
  }
}
