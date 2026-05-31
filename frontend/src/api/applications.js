import api from './axiosConfig';
import endpoints from './endpoints';

export function getActivityFeed() {
  return api.get(endpoints.applications.activity);
}

export function getApplicationDetail(appId) {
  return api.get(endpoints.applications.detail(appId));
}

export function applyFromContact(listingId) {
  return api.post(endpoints.applications.fromContact, { listing_id: listingId });
}

export function withdrawApplication(appId) {
  return api.post(endpoints.applications.withdraw(appId));
}

export function landlordAcceptApplication(appId) {
  return api.post(endpoints.applications.landlordAccept(appId));
}

export function landlordRejectApplication(appId) {
  return api.post(endpoints.applications.landlordReject(appId));
}

export function landlordApproveLease(appId) {
  return api.post(endpoints.applications.landlordApproveLease(appId));
}

export function tenantConfirmApplication(appId) {
  return api.post(endpoints.applications.tenantConfirm(appId));
}

export function setApplicationMoveIn(appId, moveInDate) {
  return api.post(endpoints.applications.moveIn(appId), { move_in_date: moveInDate });
}

export function proposeTour(appId, scheduledAt) {
  return api.post(endpoints.applications.proposeTour(appId), { scheduled_at: scheduledAt });
}

export function acceptTour(tourId) {
  return api.post(endpoints.applications.acceptTour(tourId));
}

export function rejectTour(tourId) {
  return api.post(endpoints.applications.rejectTour(tourId));
}

export function counterProposeTour(tourId, scheduledAt) {
  return api.post(endpoints.applications.counterTour(tourId), { scheduled_at: scheduledAt });
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
  awaiting_lease: 'Arrange lease signing',
  awaiting_move_in: 'Pending move-in',
  scheduled: 'Move-in scheduled',
  active: 'Active tenant',
  rejected: 'Declined',
  withdrawn: 'Withdrawn',
};

export function applicationStatusLabel(status, { isLandlord = false } = {}) {
  if (status === 'pending' && isLandlord) return 'Needs your review';
  if (status === 'awaiting_lease' && isLandlord) return 'Confirm lease signed';
  return APPLICATION_STATUS_LABELS[status] || status;
}

export function applicationStatusClass(status) {
  if (status === 'pending' || status === 'awaiting_tenant') return 'status-review';
  if (status === 'awaiting_lease' || status === 'awaiting_move_in') return 'status-pending';
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
