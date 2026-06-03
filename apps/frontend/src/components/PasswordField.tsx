import { useMemo, useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { evaluatePassword, STRENGTH_COLORS } from '@/lib/passwordStrength';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  showStrength?: boolean;
  autoComplete?: string;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  required,
  showStrength = true,
  autoComplete,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const strength = useMemo(() => evaluatePassword(value), [value]);

  return (
    <div>
      <label htmlFor={id} className="label-field">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          className="input-field pr-12"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-3 space-y-2 rounded-input border border-border bg-surface/80 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Password strength</span>
            <span
              className={`font-semibold capitalize ${
                strength.level === 'weak'
                  ? 'text-danger'
                  : strength.level === 'fair'
                    ? 'text-warning'
                    : strength.level === 'good'
                      ? 'text-accent'
                      : 'text-success'
              }`}
            >
              {strength.label}
            </span>
          </div>
          <div className="flex h-1.5 gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-full flex-1 rounded-full transition-colors ${
                  i <= strength.score ? STRENGTH_COLORS[strength.level] : 'bg-border'
                }`}
              />
            ))}
          </div>
          <ul className="grid gap-1 text-xs text-muted sm:grid-cols-2">
            <CheckItem ok={strength.checks.length} text={`At least 8 characters`} />
            <CheckItem ok={strength.checks.upper} text="Uppercase letter" />
            <CheckItem ok={strength.checks.lower} text="Lowercase letter" />
            <CheckItem ok={strength.checks.number} text="Number" />
            <CheckItem ok={strength.checks.special} text="Special character" />
          </ul>
        </div>
      )}
    </div>
  );
}

function CheckItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-success' : 'text-muted'}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
      {text}
    </li>
  );
}
