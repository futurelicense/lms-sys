import { Component } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ToastProvider } from '../components/feedback/Toast';
import ErrorState from '../components/common/ErrorState';
import store from './store';
import router from './routes';
import AuthProvider from './providers/AuthProvider';
import ThemeProvider from './providers/ThemeProvider';
import QueryProvider from './providers/QueryProvider';

/**
 * Top-level error boundary. Anything that escapes a route boundary lands here
 * instead of unmounting the whole tree into a blank page.
 */
class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Replace with your error reporter (Sentry, Datadog, ...).
    console.error('Unhandled UI error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="The application hit an unexpected error"
          error={this.state.error}
          onRetry={() => window.location.reload()}
          retryLabel="Reload"
        />
      );
    }
    return this.props.children;
  }
}

export const App = () => (
  <RootErrorBoundary>
    <ReduxProvider store={store}>
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryProvider>
    </ReduxProvider>
  </RootErrorBoundary>
);

export default App;
