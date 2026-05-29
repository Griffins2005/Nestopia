import React from 'react';
import { passwordStrengthScore, PASSWORD_RULES } from '../api/auth';

export default function PasswordStrength({ password, showEmpty = false }) {
  if (!password && !showEmpty) return null;

  const score = passwordStrengthScore(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  return (
    <div className="pw-strength">
      <div className="pw-strength-bar" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={'pw-strength-seg' + (score >= n ? ` on s${score}` : '')} />
        ))}
      </div>
      {password && <p className="pw-strength-label">{labels[score] || ''}</p>}
      <ul className="pw-strength-rules">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.key} className={ok ? 'ok' : ''}>
              {ok ? '✓' : '○'} {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
