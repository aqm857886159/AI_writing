import React from 'react';
import { diag } from '../diag/logger.js';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) {
    diag.emit({ type: 'react.error', error: String(error), stack: info?.componentStack });
  }
  render() { return this.state.hasError ? <div>组件异常，已记录。</div> : this.props.children; }
}


