import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { Alert } from '@/components/Alert';
import { PasswordField } from '@/components/PasswordField';
import { useToast } from '@/components/Toast';
import * as authApi from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { evaluatePassword } from '@/lib/passwordStrength';

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const strength = evaluatePassword(password);
    if (strength.score < 4) {
      setError('Choose a stronger password (meet at least four requirements below).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.register({ firstName, lastName, email, password });
      toast.success('Account created', 'Check your email for the verification code.');
      navigate('/verify-otp', {
        state: { email, purpose: 'EMAIL_VERIFICATION' },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Create Account</h1>
      <p className="mt-2 text-sm text-muted">
        Start your inspection journey with our professional suite.
      </p>

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="label-field">
              First Name
            </label>
            <input
              id="firstName"
              required
              className="input-field"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="label-field">
              Last Name
            </label>
            <input
              id="lastName"
              required
              className="input-field"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
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
        <PasswordField
          id="password"
          label="Password"
          required
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        <div className="flex gap-3 rounded-card border border-border border-l-4 border-l-primary bg-surface p-4">
          <Shield className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-text">Email Verification</p>
            <p className="mt-1 text-xs text-muted">
              A 6-digit OTP will be sent to your inbox after registration. You must verify before
              signing in.
            </p>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        By signing up, you agree to TWZ operational terms and privacy protocol.
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
