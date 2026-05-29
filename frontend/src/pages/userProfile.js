import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { useNestopia } from '../context/NestopiaContext';
import { ProfileInfoCard } from '../components/profile/details';
import { getPublicProfile, roleLabel, submitProfileReview } from '../api/user';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, flashToast } = useNestopia();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadProfile = useCallback(() => {
    setLoading(true);
    setNotFound(false);
    return getPublicProfile(id)
      .then((res) => {
        if (res.data?.is_self) {
          navigate('/profile', { replace: true });
          return null;
        }
        setProfile(res.data);
        return res.data;
      })
      .catch(() => {
        setProfile(null);
        setNotFound(true);
        return null;
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmitReview = async ({ rating, body }) => {
    if (Number(id) === me?.id) {
      flashToast("You can't review yourself.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await submitProfileReview(id, { rating, body });
      setProfile(res.data);
      flashToast('Review posted.');
    } catch (err) {
      setReviewSubmitting(false);
      throw err;
    }
    setReviewSubmitting(false);
  };

  if (!me) {
    return (
      <div className="profile-shell">
        <p style={{ color: 'var(--ntp-fg-soft)' }}>Sign in to view member profiles.</p>
        <button type="button" className="cta-btn" onClick={() => navigate('/login', { state: { from: { pathname: `/users/${id}` } } })}>
          Sign in
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-shell">
        <p style={{ color: 'var(--ntp-fg-muted)' }}>Loading profile…</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="profile-shell">
        <button type="button" className="detail-back" onClick={() => navigate(-1)}>
          <Icon name="arrow-left" /> Back
        </button>
        <p style={{ color: 'var(--ntp-fg-soft)' }}>Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <button type="button" className="detail-back" onClick={() => navigate(-1)}>
        <Icon name="arrow-left" /> Back
      </button>
      <ProfileInfoCard
        profile={profile}
        isSelf={false}
        subtitle={`${roleLabel(profile.role)} on Nestopia`}
        onSubmitReview={handleSubmitReview}
        reviewSubmitting={reviewSubmitting}
      />
    </div>
  );
}
