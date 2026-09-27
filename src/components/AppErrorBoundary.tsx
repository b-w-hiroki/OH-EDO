import React from "react";

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("OH!EDO runtime error", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fatal-error" role="alert">
        <h1>町の様子がおかしいようです</h1>
        <p>セーブはそのままです。ページを読み直すと続きから再開できます。</p>
        <button className="primary" onClick={() => window.location.reload()}>
          読み直す
        </button>
      </main>
    );
  }
}
