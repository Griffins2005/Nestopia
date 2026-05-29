import api from './axiosConfig';

export function getActivityFeed() {
  return api.get('/api/applications/activity');
}

export function applyFromContact(listingId) {
  return api.post('/api/applications/from-contact', { listing_id: listingId });
}

export function withdrawApplication(appId) {
  return api.post(`/api/applications/${appId}/withdraw`);
}

export function landlordAcceptApplication(appId) {
  return api.post(`/api/applications/${appId}/landlord-accept`);
}

export function landlordRejectApplication(appId) {
  return api.post(`/api/applications/${appId}/landlord-reject`);
}

export function tenantConfirmApplication(appId) {
  return api.post(`/api/applications/${appId}/tenant-confirm`);
}

export function setApplicationMoveIn(appId, moveInDate) {
  return api.post(`/api/applications/${appId}/move-in`, { move_in_date: moveInDate });
}

export function proposeTour(appId, scheduledAt) {
  return api.post(`/api/applications/${appId}/tours`, { scheduled_at: scheduledAt });
}

export function acceptTour(tourId) {
  return api.post(`/api/applications/tours/${tourId}/accept`);
}

export function rejectTour(tourId) {
  return api.post(`/api/applications/tours/${tourId}/reject`);
}

export function counterProposeTour(tourId, scheduledAt) {
  return api.post(`/api/applications/tours/${tourId}/counter`, { scheduled_at: scheduledAt });
}

export function todayDateValue() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dt = new Date(`${dateStr}T${timeStr}`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

export function formatTourWhen(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const APPLICATION_STATUS_LABELS = {
  pending: 'Under review',
  awaiting_tenant: 'Awaiting tenant',
  awaiting_move_in: 'Pending move-in',
  scheduled: 'Move-in scheduled',
  active: 'Active tenant',
  rejected: 'Declined',
  withdrawn: 'Withdrawn',
};

export function applicationStatusClass(status) {
  if (status === 'pending' || status === 'awaiting_tenant') return 'status-review';
  if (status === 'awaiting_move_in') return 'status-pending';
  if (status === 'scheduled' || status === 'active') return 'status-approved';
  if (status === 'rejected') return 'status-declined';
  return 'status-muted';
}

export function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function toDatetimeLocalValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
