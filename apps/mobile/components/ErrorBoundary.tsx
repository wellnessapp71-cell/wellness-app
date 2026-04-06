import React from "react";
import { View, Text, Pressable } from "react-native";
import * as Sentry from "@sentry/react-native";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#F2F2F7",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>:(</Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#1C1C1E",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#8A8A8E",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            The app ran into an unexpected error. Try restarting or tap below to
            recover.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              style={{
                fontSize: 12,
                color: "#FF3B30",
                textAlign: "left",
                marginBottom: 24,
                fontFamily: "monospace",
                padding: 12,
                backgroundColor: "#FF3B3010",
                borderRadius: 8,
                overflow: "hidden",
                alignSelf: "stretch",
              }}
              numberOfLines={6}
            >
              {this.state.error.message}
            </Text>
          )}
          <Pressable
            onPress={this.handleReset}
            style={{
              backgroundColor: "#007AFF",
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
