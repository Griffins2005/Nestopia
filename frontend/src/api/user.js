import api from './axiosConfig';

export function getCurrentUser() {
  return api.get('/api/users/me');
}

export function getPublicProfile(userId) {
  return api.get(`/api/users/profile/${userId}`);
}

export function submitProfileReview(userId, { rating, body }) {
  return api.post(`/api/users/profile/${userId}/reviews`, { rating, body });
}

export function updateProfile(payload) {
  return api.patch('/api/users/me', payload);
}

export function uploadProfilePhoto(file) {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/users/upload-profile-doc', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function changePassword(currentPassword, newPassword) {
  return api.post('/api/users/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export function linkWallet(walletAddress) {
  return api.post('/api/users/link-wallet', { wallet_address: walletAddress });
}

export function profilePhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path;
}

export function roleLabel(role) {
  if (role === 'landlord') return 'Landlord';
  if (role === 'renter') return 'Tenant';
  return 'Member';
}

export function displayName(user) {
  const name = user?.name?.trim();
  if (name) return name;
  const email = user?.email || '';
  if (email.includes('@')) return email.split('@')[0];
  return 'Member';
}

export function nameOrPlaceholder(user) {
  return user?.name?.trim() || '';
}

export function formatMemberSince(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export const CONTACT_PREFERENCE_OPTIONS = [
  { value: 'any', label: 'Any', hint: 'Email, text, or call — we pick the best channel for each inquiry.' },
  { value: 'text', label: 'Text', hint: 'Tenants reach you by SMS (phone number required).' },
  { value: 'email', label: 'Email', hint: 'Tenants send a pre-filled inquiry email only.' },
];

export function contactPreferenceLabel(value) {
  const normalized = normalizeContactPreference(value);
  return CONTACT_PREFERENCE_OPTIONS.find((o) => o.value === normalized)?.label || 'Any';
}

export function normalizeContactPreference(value) {
  const pref = (value || 'any').toLowerCase();
  if (pref === 'phone') return 'text';
  if (['any', 'text', 'email'].includes(pref)) return pref;
  return 'any';
}

export function hostFirstName(host) {
  const name = (host?.name || 'Host').trim();
  return name.split(/\s+/)[0] || 'Host';
}

export function buildListingInquiryMessage({ listing, tenant, host, listingUrl }) {
  const hostName = hostFirstName(host);
  const tenantName = displayName(tenant);
  const url = listingUrl || (typeof window !== 'undefined' && listing?.id
    ? `${window.location.origin}/listing/${listing.id}`
    : '');

  const lines = [
    `Hi ${hostName},`,
    '',
    `I'm ${tenantName} and I'm interested in "${listing?.title || 'your listing'}"${listing?.location ? ` at ${listing.location}` : ''}.`,
  ];

  if (listing?.rent_price) {
    lines.push(`Listed at $${Number(listing.rent_price).toLocaleString()}/month.`);
  }

  lines.push('', "I'd love to learn more about availability and possibly schedule a tour.");

  if (url) lines.push('', `Listing: ${url}`);

  const signOff = ['Thanks,', tenantName];
  if (tenant?.email) signOff.push(tenant.email);
  lines.push('', ...signOff);

  return lines.join('\n');
}

function normalizePhoneDigits(phone) {
  return (phone || '').trim().replace(/[^\d+]/g, '');
}

function allContactChannels({ host, listing, tenant, listingUrl }) {
  if (!host) return [];

  const channels = [];
  const first = hostFirstName(host);
  const email = (host.email || '').trim();
  const digits = normalizePhoneDigits(host.phone);
  const message = listing && tenant
    ? buildListingInquiryMessage({ listing, tenant, host, listingUrl })
    : '';

  if (email) {
    const subject = encodeURIComponent(`Nestopia inquiry: ${listing?.title || 'your listing'}`);
    const body = encodeURIComponent(message);
    channels.push({
      type: 'email',
      label: 'Email',
      actionLabel: `Email ${first}`,
      href: `mailto:${email}?subject=${subject}&body=${body}`,
      icon: 'envelope',
    });
  }

  if (digits) {
    channels.push({
      type: 'phone',
      label: 'Call',
      actionLabel: `Call ${first}`,
      href: `tel:${digits}`,
      icon: 'phone',
    });
    if (message) {
      channels.push({
        type: 'text',
        label: 'Text',
        actionLabel: `Text ${first}`,
        href: `sms:${digits}?body=${encodeURIComponent(message)}`,
        icon: 'message',
      });
    }
  }

  return channels;
}

function pickPrimaryChannel(channels, pref) {
  if (!channels.length) return null;
  if (pref === 'email') {
    return channels.find((c) => c.type === 'email') || null;
  }
  if (pref === 'text') {
    return channels.find((c) => c.type === 'text') || channels.find((c) => c.type === 'phone') || null;
  }
  return channels.find((c) => c.type === 'email')
    || channels.find((c) => c.type === 'text')
    || channels.find((c) => c.type === 'phone')
    || channels[0];
}

function filterChannelsByPreference(channels, pref) {
  if (pref === 'email') return channels.filter((c) => c.type === 'email');
  if (pref === 'text') return channels.filter((c) => c.type === 'text' || c.type === 'phone');
  return channels;
}

/** Host contact channels tenants use after sign-in (off-platform). */
export function hostContactChannels(context = {}) {
  const { host } = context;
  const pref = normalizeContactPreference(host?.contact_preference || host?.contactPreference);
  const all = allContactChannels(context);
  const visible = filterChannelsByPreference(all, pref);
  const primary = pickPrimaryChannel(all, pref);

  return visible
    .map((ch) => ({ ...ch, preferred: primary ? ch.type === primary.type : false }))
    .sort((a, b) => Number(b.preferred) - Number(a.preferred));
}

export function preferredContactChannel(context) {
  const channels = hostContactChannels(context);
  return channels.find((c) => c.preferred) || channels[0] || null;
}

export function otherContactChannels(context) {
  const channels = hostContactChannels(context);
  const preferred = preferredContactChannel(context);
  if (!preferred) return channels;
  return channels.filter((c) => c.type !== preferred.type);
}

export function isValidPhone(phone) {
  return !phone || /^(\+?\d{5,15})$/.test(phone.trim());
}

export function maskedPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length < 6) return phone;
  return `${phone.slice(0, 4)}•••${phone.slice(-2)}`;
}
