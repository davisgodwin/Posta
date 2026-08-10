import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, User, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register(formData);
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-envelope/40 border border-envelope rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-gold/10 text-gold rounded-full text-xs font-semibold mb-2">
            JOIN POSTA
          </div>
          <h1 className="font-serif text-3xl text-ink">Create Your Postbox</h1>
          <p className="text-sm text-ink/60 mt-1">Start exchanging meaningful digital letters.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-stampRed/10 border border-stampRed/30 text-stampRed text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-envelope rounded-lg focus:outline-none focus:border-gold"
                placeholder="Sarah Jenkins"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-ink/40 text-sm font-semibold">@</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full pl-8 pr-3 py-2 text-sm bg-paper border border-envelope rounded-lg focus:outline-none focus:border-gold"
                placeholder="sarah_j"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-envelope rounded-lg focus:outline-none focus:border-gold"
                placeholder="sarah@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-envelope rounded-lg focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-envelope rounded-lg focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink/90 transition flex items-center justify-center gap-2"
          >
            {submitting ? 'Creating Postbox...' : 'Register'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-ink/60 mt-6">
          Already have a postbox?{' '}
          <Link to="/login" className="text-gold font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}