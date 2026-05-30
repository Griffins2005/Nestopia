/** Canonical API paths — keep in sync with backend routers under backend/app/routers/ */

export const endpoints = {
  health: '/health',

  auth: {
    signup: '/api/auth/signup',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    verify2fa: '/api/auth/verify-2fa',
    session: '/api/auth/session',
    passwordResetRequest: '/api/auth/password-reset/request',
    passwordResetConfirm: '/api/auth/password-reset/confirm',
    googleLogin: (role) => `/api/auth/google/login?role=${role}`,
  },

  users: {
    me: '/api/users/me',
    uploadProfileDoc: '/api/users/upload-profile-doc',
    changePassword: '/api/users/change-password',
    linkWallet: '/api/users/link-wallet',
    profile: (userId) => `/api/users/profile/${userId}`,
    profileReview: (userId) => `/api/users/profile/${userId}/reviews`,
  },

  preferences: {
    renter: '/api/preferences/renter',
    landlord: '/api/preferences/landlord',
  },

  listings: {
    list: '/api/listings/',
    owned: '/api/listings/owned',
    saved: '/api/listings/saved/',
    savedItem: (id) => `/api/listings/saved/${id}`,
    detail: (id) => `/api/listings/${id}`,
    uploadImage: '/api/listings/upload-image',
  },

  matches: {
    daily: '/api/matches/daily',
  },

  applications: {
    activity: '/api/applications/activity',
    fromContact: '/api/applications/from-contact',
    withdraw: (id) => `/api/applications/${id}/withdraw`,
    landlordAccept: (id) => `/api/applications/${id}/landlord-accept`,
    landlordReject: (id) => `/api/applications/${id}/landlord-reject`,
    tenantConfirm: (id) => `/api/applications/${id}/tenant-confirm`,
    moveIn: (id) => `/api/applications/${id}/move-in`,
    proposeTour: (id) => `/api/applications/${id}/tours`,
    acceptTour: (id) => `/api/applications/tours/${id}/accept`,
    rejectTour: (id) => `/api/applications/tours/${id}/reject`,
    counterTour: (id) => `/api/applications/tours/${id}/counter`,
  },

  geo: {
    search: '/api/geo/search',
  },

  security: {
    status: '/api/security/status',
    totpSetup: '/api/security/totp/setup',
    totpConfirm: '/api/security/totp/confirm',
    totpDisable: '/api/security/totp/disable',
  },

  stats: {
    summary: '/api/stats/summary',
  },

  tokens: {
    balance: '/api/tokens/balance/',
    spend: '/api/tokens/spend/',
  },

  payments: {
    initiate: '/api/payments/initiate',
    confirm: '/api/payments/confirm',
    list: '/api/payments',
    detail: (id) => `/api/payments/${id}`,
  },
};

export default endpoints;
