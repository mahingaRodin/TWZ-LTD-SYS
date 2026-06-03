const MIN_PASSWORD_LENGTH = 8;

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrength {
  score: number;
  level: StrengthLevel;
  label: string;
  checks: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
  };
}

export function evaluatePassword(password: string): PasswordStrength {
  const checks = {
    length: password.length >= MIN_PASSWORD_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;

  let level: StrengthLevel = 'weak';
  let label = 'Weak';
  if (score >= 5) {
    level = 'strong';
    label = 'Strong';
  } else if (score >= 4) {
    level = 'good';
    label = 'Good';
  } else if (score >= 3) {
    level = 'fair';
    label = 'Fair';
  }

  return { score, level, label, checks };
}

export const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  weak: 'bg-danger',
  fair: 'bg-warning',
  good: 'bg-accent',
  strong: 'bg-success',
};
