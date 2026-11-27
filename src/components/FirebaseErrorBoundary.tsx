import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class FirebaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Ocurrió un error inesperado en el estudio.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Studio boundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-amber-200 bg-amber-50/40 p-7 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Se detectó un problema temporal
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recarga el estudio para restablecer la conexión con tu cuenta y tus datos.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recargar Estudio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
