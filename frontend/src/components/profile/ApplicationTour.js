import React, { useState } from 'react';
import { formatTourWhen } from '../../api/applications';
import TourSchedulePicker from './TourSchedulePicker';

export default function ApplicationTourPanel({ app, userId, onAction, busyId }) {
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDate, setTourDate] = useState('');
  const [tourTime, setTourTime] = useState('');
  const [counterOpen, setCounterOpen] = useState(false);

  if (app.status !== 'pending') return null;

  const busy = busyId === app.id;
  const tourBusy = busyId === `tour-${app.id}`;
  const pendingTour = app.pending_tour;
  const acceptedTour = app.accepted_tour;

  if (acceptedTour) {
    return (
      <div className="app-tour-panel app-tour-confirmed">
        <p className="app-tour-label">Tour confirmed</p>
        <p className="tour-proposed-label">
          <strong>{formatTourWhen(acceptedTour.scheduled_at)}</strong>
        </p>
      </div>
    );
  }

  if (pendingTour && pendingTour.proposed_by_id === userId) {
    return (
      <div className="app-tour-panel">
        <p className="app-tour-label">Optional tour (before acceptance)</p>
        <p className="tour-proposed-label">
          Tour pending approval: {formatTourWhen(pendingTour.scheduled_at)}
        </p>
      </div>
    );
  }

  if (pendingTour && pendingTour.proposed_by_id !== userId) {
    return (
      <div className="app-tour-panel">
        <p className="app-tour-label">Optional tour (before acceptance)</p>
        <p className="tour-proposed-label">
          Tour proposed: {formatTourWhen(pendingTour.scheduled_at)}
        </p>
        {counterOpen ? (
          <>
            <TourSchedulePicker
              label="Propose another time"
              proposedAt={pendingTour.scheduled_at}
              date={tourDate}
              time={tourTime}
              onDateChange={setTourDate}
              onTimeChange={setTourTime}
            />
            <div className="activity-app-actions">
              <button
                type="button"
                className="cta-btn small"
                disabled={busy || !tourDate || !tourTime}
                onClick={() => onAction('tour-counter', pendingTour.id, { tourDate, tourTime })}
              >
                Send proposal
              </button>
              <button type="button" className="activity-btn-link" onClick={() => setCounterOpen(false)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="activity-app-actions">
            <button type="button" className="cta-btn small" disabled={busy} onClick={() => onAction('tour-accept', pendingTour.id)}>
              Accept tour
            </button>
            <button type="button" className="activity-btn-decline" disabled={busy} onClick={() => onAction('tour-reject', pendingTour.id)}>
              Decline
            </button>
            <button
              type="button"
              className="activity-btn-link"
              onClick={() => {
                setCounterOpen(true);
                setTourDate('');
                setTourTime('');
              }}
            >
              Propose another time
            </button>
          </div>
        )}
      </div>
    );
  }

  if (tourOpen) {
    return (
      <div className="app-tour-panel">
        <p className="app-tour-label">Optional tour (before acceptance)</p>
        <TourSchedulePicker
          label="Propose a tour time"
          date={tourDate}
          time={tourTime}
          onDateChange={setTourDate}
          onTimeChange={setTourTime}
        />
        <div className="activity-app-actions">
          <button
            type="button"
            className="cta-btn small"
            disabled={tourBusy || !tourDate || !tourTime}
            onClick={() => onAction('tour-propose', app.id, { tourDate, tourTime })}
          >
            Propose tour
          </button>
          <button type="button" className="activity-btn-link" onClick={() => setTourOpen(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-tour-panel">
      <p className="app-tour-label">Optional tour (before acceptance)</p>
      <button type="button" className="activity-btn-link" onClick={() => setTourOpen(true)}>
        Schedule a tour
      </button>
    </div>
  );
}
