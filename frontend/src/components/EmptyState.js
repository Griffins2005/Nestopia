import React from 'react';
import { Icon, RegIcon } from './Icons';

export function ListingsLoading({ count = 6, className = '' }) {
  return (
    <div className={`listings-grid listings-skeleton-grid ${className}`.trim()} aria-busy="true" aria-label="Loading homes">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="listing-skeleton-card">
          <div className="listing-skeleton-img" />
          <div className="listing-skeleton-body">
            <div className="listing-skeleton-line short" />
            <div className="listing-skeleton-line" />
            <div className="listing-skeleton-line medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmptyState({
  icon = 'compass',
  iconFilled = false,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false,
  className = '',
}) {
  const IconComponent = iconFilled ? Icon : RegIcon;

  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''} ${className}`.trim()} role="status">
      <div className="empty-state-icon" aria-hidden="true">
        <IconComponent name={icon} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="empty-state-actions">
          {primaryAction && (
            <button type="button" className="cta-btn" onClick={primaryAction.onClick}>
              {primaryAction.icon && <Icon name={primaryAction.icon} />}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button type="button" className="cta-btn ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
