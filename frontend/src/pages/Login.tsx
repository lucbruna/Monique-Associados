import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface LoginForm {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export default function Login() {
  const [require2FA, setRequire2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { setAuth, setPermissions } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', data);

      if (response.data.require2FA) {
        setRequire2FA(true);
        toast.info('Digite o código 2FA');
        return;
      }

      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);

      // Buscar permissões do usuário
      try {
        const permResponse = await api.get('/users/me/permissions');
        setPermissions(permResponse.data.data.permissions);
      } catch (e) {
        console.error('Erro ao buscar permissões:', e);
      }

      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0f17] via-[#121826] to-[#0b0f17] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Brilho dourado sutil de fundo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_55%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl" aria-hidden="true" />

      <div className="max-w-md w-full space-y-8 relative">
        <div className="text-center">
          <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 grid place-items-center text-3xl shadow-glow-gold ring-1 ring-gold-300/40">
            ⚖️
          </div>
          <h1 className="text-5xl font-bold text-gold-light mb-3 tracking-[0.02em]">Monique Advogados</h1>
          <span className="mx-auto gold-rule" aria-hidden="true"></span>
          <h2 className="text-lg font-medium text-slate-300 mt-4 tracking-wide">Sistema de Gestão Jurídica</h2>
          <p className="mt-2 text-slate-500 text-sm">Entre com suas credenciais</p>
        </div>

        <form className="mt-8 space-y-6 bg-white/95 backdrop-blur p-8 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-gold-400/30" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                {...register('email', { required: 'Email é obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })}
                type="email"
                className="input-field"
                placeholder="seu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Senha
              </label>
              <input
                {...register('password', { required: 'Senha é obrigatória' })}
                type="password"
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {require2FA && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-slate-700 mb-1">
                  Código 2FA
                </label>
                <input
                  {...register('twoFactorCode', { required: require2FA ? 'Código 2FA é obrigatório' : false })}
                  type="text"
                  className="input-field"
                  placeholder="000000"
                  maxLength={6}
                />
                {errors.twoFactorCode && <p className="mt-1 text-sm text-red-600">{errors.twoFactorCode.message}</p>}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm">
          &copy; 2026 ⚖️ Monique Advogados. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
