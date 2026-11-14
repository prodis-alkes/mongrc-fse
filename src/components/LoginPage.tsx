import React, { useState } from 'react';
import { useGRC } from '../context/GRCContext';
import { 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  onExploreAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onExploreAsGuest }) => {
  const { login, theme, toggleTheme, connectDatabaseWithGoogle, isDbConnecting, dbSyncError } = useGRC();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Gagal masuk. Periksa kembali kredensial Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Background Subtle Gradient & Accents */}
      <div className="absolute inset-0 bg-radial from-blue-100/70 via-slate-100 to-slate-200 dark:from-blue-900/30 dark:via-slate-900 dark:to-slate-950 pointer-events-none" />

      {/* Top-Right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          onClick={toggleTheme}
          className="inline-flex items-center p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
        >
          <span
            className={`p-1.5 rounded-md transition-colors ${
              theme === 'light'
                ? 'bg-amber-100 text-amber-600'
                : 'text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </span>
          <span
            className={`p-1.5 rounded-md transition-colors ${
              theme === 'dark'
                ? 'bg-blue-900 text-blue-200'
                : 'text-slate-400'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Ministry Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-xl mb-3 p-2.5 border border-slate-200 dark:border-slate-800">
            <img 
              src="./assets/aistudio/favicon_f44d1301.png" 
              alt="Logo MonGRC Kemenkes" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            MonGRC · Ditjen P2
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Sistem Monitoring Governance, Risk & Compliance (Tata Kelola, Risiko & Kepatuhan)
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 shadow-2xs">
            Kementerian Kesehatan Republik Indonesia
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
          <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gunakan Akun Google Admin atau Username / Email Satker
              </p>
            </div>
            <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>

          {(errorMessage || dbSyncError) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage || dbSyncError}</span>
            </div>
          )}

          {/* Google Sign-In for Firestore Live Database */}
          <div className="mb-4">
            <button
              type="button"
              onClick={async () => {
                setErrorMessage(null);
                const ok = await connectDatabaseWithGoogle();
                if (ok && onSuccess) onSuccess();
              }}
              disabled={isDbConnecting}
              className="gsi-material-button w-full!"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isDbConnecting ? 'Menghubungkan ke Firestore...' : 'Sign in with Google'}
                </span>
              </div>
            </button>

            <div className="relative flex py-3 items-center">
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink mx-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                atau masuk dengan Email / Username
              </span>
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Identifier input */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username atau Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Contoh: admin.p2 atau user_batam"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Kata Sandi (Password)
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-900 rounded-xs border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-blue-600"
                />
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Ingat sesi login ini</span>
              </label>

              <span className="text-[11px] text-blue-800 dark:text-blue-400 hover:underline cursor-pointer" title="Hubungi Bagian Kepegawaian & TI Setditjen P2">
                Lupa sandi?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Optional Guest Explorer */}
          {onExploreAsGuest && (
            <div className="mt-4 pt-3 text-center border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onExploreAsGuest}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Lanjutkan melihat dashboard sebagai Tamu (Mode Hanya Baca)
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          <span>&copy; {new Date().getFullYear()} Direktorat Jenderal Pencegahan dan Pengendalian Penyakit</span>
        </div>
      </div>
    </div>
  );
};
