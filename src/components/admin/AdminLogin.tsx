import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAuth } from '@/services/adminAuth';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    adminAuth.getCurrentUser().then((user) => {
      if (user) navigate('/admin/dashboard');
    }).catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminAuth.signIn(email, password);
      if (data?.token || data?.user) navigate('/admin/dashboard');
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-sm rounded-xl border border-amber-400/30 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Conta Bloqueada</h2>
          <p className="text-slate-300 mb-4">
            Sua conta foi bloqueada após 5 tentativas inválidas de login.
          </p>
          <p className="text-sm text-slate-400">
            Entre em contato com o suporte para desbloquear sua conta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl md:text-5xl tracking-wider text-white mb-2">
            <span className="text-amber-400">R</span>AVIC
            <span className="block text-sm md:text-base tracking-[0.4em] text-slate-300 font-sans font-light -mt-2 uppercase">
              Joias
            </span>
          </h1>
          <p className="text-slate-400 mt-4">Painel Administrativo</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-amber-400/30 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="flex justify-center gap-6 mb-3">
              <button onClick={() => setIsRegister(false)} className={`${!isRegister ? 'text-amber-400' : 'text-slate-400'} font-semibold`}>Login</button>
              <button onClick={() => setIsRegister(true)} className={`${isRegister ? 'text-amber-400' : 'text-slate-400'} font-semibold`}>Cadastro</button>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{isRegister ? 'Criar Administrador' : 'Entrar no Painel'}</h2>
            <p className="text-slate-400">Acesso exclusivo para administradores</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="admin@petrleo.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {isRegister && (
              <div>
                <label htmlFor="master" className="block text-sm font-medium text-slate-300 mb-2">
                  Senha Mestre
                </label>
                <input
                  id="master"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  autoComplete="off"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
                {attemptsLeft < 5 && (
                  <p className="text-red-300 text-xs mt-1 ml-7">
                    Tentativas restantes: {attemptsLeft}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 font-semibold py-3 px-4 rounded-lg hover:from-amber-500 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async (e) => {
                if (!isRegister) return;
                e.preventDefault();
                setError('');
                setLoading(true);
                try {
                  const data = await adminAuth.signUp(email, password, masterPassword);
                  if (data?.user) navigate('/admin/dashboard');
                } catch (err: any) {
                  setError(err.message || 'Erro ao cadastrar');
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isRegister ? 'Cadastrando...' : 'Entrando...'}
                </div>
              ) : (
                isRegister ? 'Criar Administrador' : 'Entrar no Painel'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a href="#" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
              Esqueci minha senha
            </a>
            <div>
              <Link 
                to="/" 
                className="text-slate-400 hover:text-slate-300 text-sm transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar ao Site
              </Link>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default AdminLogin;
