import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login({ login: loginInput, password });
      if (res?.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      const genericMsg = err.message || 'Invalid email/username or password.';
      const requestUrl = err.config?.url;

      setError(
        `Error [Status ${status || 'Network/CORS'}]: ${
          serverMsg || genericMsg
        }${requestUrl ? ` (Target: ${requestUrl})` : ''}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-envelope/40 border border-envelope rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-ink">Welcome Back</h1>
          <p className="text-sm text-ink/60 mt-1">Unlock your postbox to read your mail.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-stampRed/10 border border-stampRed/30 text-stampRed text-xs rounded-lg break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-envelope rounded-lg focus:outline-none focus:border-gold"
                placeholder="Username or email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-envelope rounded-lg focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Unlocking...' : 'Log In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-ink/60 mt-6">
          Don't have a postbox yet?{' '}
          <Link to="/register" className="text-gold font-semibold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}