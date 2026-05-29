const ICONS = {
  "magnifying-glass": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2a8 8 0 1 0 5.293 14.043l4.39 4.39a1 1 0 0 0 1.415-1.414l-4.39-4.39A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/></svg>
  ),
  compass: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.05 6.13l-2.6 6.07a1 1 0 0 1-.52.52l-6.07 2.6a.5.5 0 0 1-.66-.66l2.6-6.07a1 1 0 0 1 .52-.52l6.07-2.6a.5.5 0 0 1 .66.66zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.5-9.5-9.5C1.1 8.1 3.3 4.5 7 4.5a5 5 0 0 1 5 3 5 5 0 0 1 5-3c3.7 0 5.9 3.6 4.5 7C19.5 16.5 12 21 12 21z"/></svg>
  ),
  "heart-outline": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5s-7-4.2-9-8.6C1.4 8.5 3.3 5 7 5a5 5 0 0 1 5 3 5 5 0 0 1 5-3c3.7 0 5.6 3.5 4 6.9-2 4.4-9 8.6-9 8.6z"/></svg>
  ),
  "circle-user": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 1 6.95 17.16c-.7-2.3-2.9-3.66-6.95-3.66s-6.24 1.37-6.95 3.66A10 10 0 0 1 12 2zm0 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2zm0 5h18a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2zm0 5h18a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2z"/></svg>
  ),
  "arrow-right": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
  ),
  "arrow-left": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>
  ),
  "arrow-up-from-bracket": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l5 5h-3v6h-4V8H7l5-5zM5 17v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3h-2v2H7v-2H5z"/></svg>
  ),
  "user-plus": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 9c0-3.5 3.5-6 7-6s7 2.5 7 6v1H2v-1zm18-8v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3z"/></svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.3 15.3 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1A18 18 0 0 1 2 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.5.57 3.6a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>
  ),
  "calendar-check": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v10H5V10h14zm-3.3 2.3l-4.2 4.2-2-2-1.5 1.5 3.5 3.5 5.7-5.7-1.5-1.5z"/></svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v10H5V10h14z"/></svg>
  ),
  "file-signature": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM7 13h6v2H7v-2zm0 4h10v2H7v-2z"/></svg>
  ),
  "champagne-glasses": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l1.5 8c.3 1.6 1.6 2.8 3.2 3l-.2 5H7v2h6v-2h-2.5l-.2-5c1.6-.2 2.9-1.4 3.2-3L15 3H5zm2.4 2h5.2l-.7 4H8.1l-.7-4zM18 11l2-8h-3l-1 4 2 4zm-1.7 1l-1 5h2.5l-1.5-5z"/></svg>
  ),
  envelope: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V18h16V7.4l-8 5.4-8-5.4zM4.4 7l7.6 5.1L19.6 7H4.4z"/></svg>
  ),
  "envelope-open-text": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9l9-6zm-5 7h10v2H7v-2zm0 4h10v2H7v-2z"/></svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 4.6L18.4 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2zm6 10l1 2.6 2.6 1-2.6 1L18 20l-1-2.6L14.4 16l2.6-1L18 12zM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13z"/></svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
  ),
  "sign-out": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a1 1 0 0 0 0-2H6V5h4a1 1 0 0 0 0-2zm6.3 5.3l2.7 2.7H10a1 1 0 0 0 0 2h8.99l-2.7 2.7a1 1 0 0 0 1.42 1.42l4.4-4.41a1 1 0 0 0 0-1.42l-4.4-4.41A1 1 0 0 0 16.3 8.3z"/></svg>
  ),
  "circle-check": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 7.7l-6.2 6.2a1 1 0 0 1-1.42 0L6 12.5a1 1 0 0 1 1.42-1.42l2.67 2.68 5.5-5.5A1 1 0 0 1 17 9.7z"/></svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3a1 1 0 0 0-1 1v1H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2h-4V4a1 1 0 0 0-1-1H9zm-3 6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9H6zm3 2h2v8H9v-8zm4 0h2v8h-2v-8z"/></svg>
  ),
  pen: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.06 4.94l3 3L7.92 17.08l-3.92.92.92-3.92L14.06 4.94zm1.41-1.41l1.3-1.3a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-1.3 1.3-3-3z"/></svg>
  ),
  bed: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5a3 3 0 0 0-3 3v2H3v9h2v-2h14v2h2v-9h-1V8a3 3 0 0 0-3-3H7zm0 2h10a1 1 0 0 1 1 1v1H6V8a1 1 0 0 1 1-1z"/></svg>
  ),
  bath: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 12h16v2a4 4 0 0 1-4 4h-.1A5 5 0 0 1 8 18H7a4 4 0 0 1-4-4v-2zm2 4a2 2 0 0 0 2 2h1a3 3 0 0 0 3-3V14H6v2zm14-8H4V6h16v2z"/></svg>
  ),
  ruler: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 8.5A1.5 1.5 0 0 1 3.5 7H20a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3.5A1.5 1.5 0 0 1 2 15.5v-7zM6 9v1h1V9H6zm3 0v1h1V9H9zm3 0v1h1V9h-1zm3 0v1h1V9h-1z"/></svg>
  ),
  "map-pin": (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.9L22 10.2l-5.2 4.5L18.5 22 12 18.2 5.5 22l1.7-7.3L2 10.2l7.1-1.3L12 2z"/></svg>
  ),
  "star-outline": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l2.9 6.9L22 10.2l-5.2 4.5L18.5 22 12 18.2 5.5 22l1.7-7.3L2 10.2l7.1-1.3L12 2z"/></svg>
  ),
  g: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 9.9 11.4H12v-3.4h9.6A10 10 0 0 0 12 2zm0 2.5a7.5 7.5 0 0 1 5.3 2.2l-2 2A4.7 4.7 0 1 0 16.5 14H12V12h7v-2H12V4.5z"/></svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zm8.94 3.5a7.96 7.96 0 0 1-.12 1l2.11 1.65-2 3.46-2.49-1a8.09 8.09 0 0 1-1.73 1l-.38 2.65H9.67l-.38-2.65a8.09 8.09 0 0 1-1.73-1l-2.49 1-2-3.46 2.11-1.65a7.96 7.96 0 0 1-.12-1c0-.34.04-.67.12-1L2.06 10.35l2-3.46 2.49 1a8.09 8.09 0 0 1 1.73-1l.38-2.65h4.68l.38 2.65a8.09 8.09 0 0 1 1.73 1l2.49-1 2 3.46-2.11 1.65c.08.33.12.66.12 1z"/></svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8V6a5 5 0 0 0-10 0v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2zm-8 0V6a3 3 0 0 1 6 0v2H9z"/></svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v10h-5v-6H11v6H6V11H3l9-8z"/></svg>
  ),
};

export function Icon({ name, className = '', style }) {
  return (
    <span
      className={`ntp-icon ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1em', height: '1em', ...style }}
      aria-hidden="true"
    >
      {ICONS[name] || null}
    </span>
  );
}

export function RegIcon({ name, className = '', style }) {
  const map = { heart: 'heart-outline' };
  return <Icon name={map[name] || name} className={className} style={style} />;
}
