import React from 'react';
import { formatTourWhen, todayDateValue } from '../../api/applications';

export default function TourSchedulePicker({
  label = 'Pick date & time',
  proposedAt,
  date,
  time,
  onDateChange,
  onTimeChange,
}) {
  return (
    <div className="tour-schedule-picker">
      {proposedAt && (
        <p className="tour-proposed-label">
          Proposed: {formatTourWhen(proposedAt)}
        </p>
      )}
      <p className="tour-schedule-label">{label}</p>
      <div className="tour-schedule-fields">
        <label className="tour-schedule-field">
          <span>Date</span>
          <input
            type="date"
            className="form-input"
            value={date}
            min={todayDateValue()}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
        <label className="tour-schedule-field">
          <span>Time</span>
          <input
            type="time"
            className="form-input"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
