import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OtpPurpose } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { useToast } from '@/components/Toast';
import * as authApi from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.requestOtp(email, OtpPurpose.PASSWORD_RESET);
      toast.info('Check your email', 'A reset code was sent to your inbox.');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(getErrorMessage(err, 'Request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Reset Password</h1>
      <p className="mt-2 text-sm text-muted">We will send a one-time code to your email.</p>

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
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Code'}
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
