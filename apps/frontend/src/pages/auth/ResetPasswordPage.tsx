import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '@/components/Alert';
import { PasswordField } from '@/components/PasswordField';
import { useToast } from '@/components/Toast';
import * as authApi from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { evaluatePassword } from '@/lib/passwordStrength';

export function ResetPasswordPage() {
  const location = useLocation();
  const state = location.state as { email?: string } | null;
  const [email, setEmail] = useState(state?.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const strength = evaluatePassword(newPassword);
    if (strength.score < 4) {
      setError('Choose a stronger password (meet at least four requirements below).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      toast.success('Password updated', 'You can sign in with your new password.');
      navigate('/login', { state: { message: 'Password updated. Please sign in.' } });
    } catch (err) {
      setError(getErrorMessage(err, 'Reset failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold">New Password</h1>
      <p className="mt-2 text-sm text-muted">
        Enter the reset code from your email and choose a new password.
      </p>
      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="label-field">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="code" className="label-field">
            OTP Code
          </label>
          <input
            id="code"
            inputMode="numeric"
            maxLength={6}
            required
            className="input-field font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        <PasswordField
          id="newPassword"
          label="New Password"
          required
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </>
  );
}
