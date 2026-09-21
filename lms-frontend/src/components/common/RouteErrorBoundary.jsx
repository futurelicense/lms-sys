import { Component } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorState from './ErrorState';

class RouteErrorBoundaryBase extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep route failures observable without exposing stack traces to users.
    console.error('Route rendering failed', error, info);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.locationKey !== this.props.locationKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This page could not be loaded"
          error={{ message: this.state.error?.message || 'Try again or navigate to another page.' }}
          onRetry={() => this.setState({ error: null })}
          retryLabel="Try again"
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Contains a failing lazy route while preserving the rest of the application.
 * Changing routes resets a previous failure, so navigation remains recoverable.
 */
export const RouteErrorBoundary = ({ children }) => {
  const location = useLocation();
  return <RouteErrorBoundaryBase locationKey={location.key}>{children}</RouteErrorBoundaryBase>;
};

export default RouteErrorBoundary;
