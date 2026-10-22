import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* Never log survey answers or tokens. */ }
  render() {
    if (this.state.failed) return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">No pudimos mostrar la encuesta</h1><p className="my-4">Recargá esta pestaña para recuperar el progreso que se haya guardado.</p><button className="survey-option" onClick={() => window.location.reload()}>Recargar</button></main>;
    return this.props.children;
  }
}
