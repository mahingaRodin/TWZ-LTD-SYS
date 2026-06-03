import { FormEvent, useState } from 'react';
import { Alert } from '@/components/Alert';
import { PasswordField } from '@/components/PasswordField';
import { RoleBadge } from '@/components/RoleBadge';
import { useToast } from '@/components/Toast';
import * as authApi from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { evaluatePassword } from '@/lib/passwordStrength';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/authSlice';

export function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  const handleProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingProfile(true);
    try {
      const updated = await authApi.updateProfile({ firstName, lastName });
      dispatch(setUser(updated));
      toast.success('Profile updated', 'Your name and details were saved.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    const strength = evaluatePassword(newPassword);
    if (strength.score < 4) {
      setError('Choose a stronger new password (meet at least four requirements).');
      return;
    }
    setError('');
    setLoadingPw(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      const refreshed = await authApi.getProfile();
      dispatch(setUser(refreshed));
      toast.success('Password changed', 'Your new password is now active.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-form space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted">Manage your account and credentials</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="card-surface border-l-4 border-l-accent p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Account</p>
        <p className="mt-2 text-lg font-semibold">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-sm text-muted">{user.email}</p>
        <div className="mt-3">
          <RoleBadge role={user.role} />
        </div>
        <p className="mt-3 text-xs text-muted">
          Email verified: {user.isVerified ? 'Yes' : 'No'}
        </p>
        {user.mustChangePassword && (
          <p className="mt-2 text-xs text-warning">Change your temporary password below to clear this notice.</p>
        )}
      </div>

      <form onSubmit={handleProfile} className="card-surface space-y-4 p-6">
        <h2 className="text-lg font-semibold">Update Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">First Name</label>
            <input
              className="input-field"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Last Name</label>
            <input
              className="input-field"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={loadingProfile}>
          {loadingProfile ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={handlePassword} className="card-surface space-y-4 p-6">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <PasswordField
          id="currentPassword"
          label="Current Password"
          required
          value={currentPassword}
          onChange={setCurrentPassword}
          showStrength={false}
          autoComplete="current-password"
        />
        <PasswordField
          id="newPassword"
          label="New Password"
          required
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <button type="submit" className="btn-primary" disabled={loadingPw}>
          {loadingPw ? 'Updating…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
