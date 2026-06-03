import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { OtpPurpose } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { useToast } from '@/components/Toast';
import * as authApi from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';

export function VerifyOtpPage() {
  const location = useLocation();
  const state = location.state as {
    email?: string;
    purpose?: OtpPurpose;
  } | null;
  const [email, setEmail] = useState(state?.email ?? '');
  const [code, setCode] = useState('');
  const purpose = state?.purpose ?? OtpPurpose.EMAIL_VERIFICATION;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp(email, code, purpose);
      toast.success('Email verified', 'You can sign in with your account.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(getErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Verify Email</h1>
      <p className="mt-2 text-sm text-muted">
        Enter the 6-digit code sent to your email inbox. Check spam if you do not see it within a
        few minutes.
      </p>

      <div className="mt-6 rounded-card border border-border border-l-4 border-l-primary bg-surface p-4 text-sm text-muted">
        Open your email client and copy the verification code from TWZ Ltd. Codes expire after 10
        minutes.
      </div>
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
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="input-field font-mono text-lg tracking-[0.3em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & Continue'}
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
