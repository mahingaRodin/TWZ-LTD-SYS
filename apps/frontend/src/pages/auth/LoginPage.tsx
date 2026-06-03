import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Alert } from '@/components/Alert';
import { PasswordField } from '@/components/PasswordField';
import * as authApi from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    from?: { pathname: string };
    message?: string;
  } | null;
  const from = state?.from?.pathname ?? '/app';
  const flashMessage = state?.message;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      dispatch(setCredentials({ user: result.user, tokens: result.tokens }));
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Sign In</h1>
      <p className="mt-2 text-sm text-muted">Access your TWZ fire safety operations dashboard.</p>

      {flashMessage && (
        <div className="mt-6">
          <Alert variant="success">{flashMessage}</Alert>
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="label-field">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          required
          value={password}
          onChange={setPassword}
          showStrength={false}
          autoComplete="current-password"
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        No account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
