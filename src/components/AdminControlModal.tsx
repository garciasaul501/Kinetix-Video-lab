import React, { useState } from 'react';
import {
  ShieldCheck,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Sparkles,
  Crown,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  StudioUserAccount,
  signInWithGooglePopup,
  signOutFirebaseUser,
} from '../services/firebaseStudioService';

export interface AdminUserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'subscriber';
  plan: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface AdminSession {
  token: string;
  user: AdminUserAccount;
  loggedInAt: string;
}

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseProfile: StudioUserAccount | null;
  isAdmin: boolean;
  isAuthLoading?: boolean;
  isPreviewingCustomerView?: boolean;
  onTogglePreviewCustomerView?: () => void;
  onOpenAdminDashboard: () => void;
  savedAudiobooksCount: number;
  scriptHistoryCount: number;
}

export const AdminControlModal: React.FC<AdminControlModalProps> = ({
  isOpen,
  onClose,
  firebaseProfile,
  isAdmin,
  isAuthLoading = false,
  isPreviewingCustomerView = false,
  onTogglePreviewCustomerView,
  onOpenAdminDashboard,
  savedAudiobooksCount,
  scriptHistoryCount,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSigningIn(true);
    try {
      await signInWithGooglePopup();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes('popup-closed-by-user')
          ? 'Cerraste la ventana de inicio de sesión. Haz clic de nuevo para continuar.'
          : 'No se pudo completar el inicio de sesión con Google. Permite ventanas emergentes e intenta de nuevo.';
      setErrorMsg(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutFirebaseUser();
      onClose();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                isAdmin ? 'bg-emerald-600' : 'bg-amber-500 text-slate-950'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-extrabold tracking-tight">
                  {isAdmin
                    ? 'Cuenta de Administrador'
                    : firebaseProfile
                      ? 'Mi Cuenta de Estudio'
                      : 'Acceso al Estudio'}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase font-bold">
                  {isAdmin ? 'ADMIN VERIFICADO' : firebaseProfile ? 'CONECTADO' : 'GOOGLE AUTH'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kinetix Studio · Control de Acceso y Roles Reales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isAuthLoading ? (
            <div className="py-10 text-center space-y-2 text-xs text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
              <p>Verificando credenciales seguras...</p>
            </div>
          ) : !firebaseProfile ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-1.5">
                <p className="font-extrabold text-slate-950">
                  Inicio de Sesión Seguro con Google
                </p>
                <p className="leading-relaxed">
                  Al entrar con tu cuenta de Google, el sistema detecta automáticamente si eres <strong>Administrador</strong> (desbloqueando el panel de suscriptores, actividad en vivo y modo ilimitado sin opciones de suscriptor) o <strong>Cliente</strong>.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Conectando con Google...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Entrar con Google (Admin o Cliente)</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500">
                Por privacidad, ningún correo personal ni contraseña se muestra públicamente en la interfaz.
              </p>
            </div>
          ) : isAdmin ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm">
                    AD
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-950">
                      Administrador Principal
                    </div>
                    <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Modo Administrador Activo · Acceso Ilimitado</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                    AUDIOLIBROS LOCALES
                  </span>
                  <div className="text-sm font-extrabold text-slate-950 mt-0.5">
                    {savedAudiobooksCount} guardados
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                    HISTORIAL GUIONES
                  </span>
                  <div className="text-sm font-extrabold text-slate-950 mt-0.5">
                    {scriptHistoryCount} versiones
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenAdminDashboard();
                  onClose();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Abrir Panel de Suscriptores, Uso y Rentabilidad</span>
              </button>

              {onTogglePreviewCustomerView && (
                <button
                  type="button"
                  onClick={() => {
                    onTogglePreviewCustomerView();
                    onClose();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                    isPreviewingCustomerView
                      ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isPreviewingCustomerView ? (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-700" />
                      <span>Salir de Vista de Cliente (Volver a Admin Puro)</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>Activar Vista de Cliente (Ver opciones de suscriptor)</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Seguir en el Estudio
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-950">
                    {firebaseProfile.displayName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                    Plan: {firebaseProfile.planTier}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Proyectos creados: <strong>{firebaseProfile.projectsCreated}</strong> · Tokens:{' '}
                  <strong>{firebaseProfile.tokenBalance.toLocaleString()}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Esta cuenta tiene rol de cliente/suscriptor. Si eres el propietario del estudio, cierra sesión y entra con tu cuenta de Google de Administrador.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cambiar de Cuenta</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
