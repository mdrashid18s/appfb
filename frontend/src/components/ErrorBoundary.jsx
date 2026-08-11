import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          background: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #fecaca',
          margin: '1rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ color: '#dc2626', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            {this.props.title || 'Component Encountered an Issue'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'An unexpected error occurred while loading this section.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            style={{
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔄 Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
