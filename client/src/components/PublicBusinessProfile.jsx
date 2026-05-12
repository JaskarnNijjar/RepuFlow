import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../supabase";

function PublicBusinessProfile() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [placeDetails, setPlaceDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sentimentScore, setSentimentScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimError, setClaimError] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const response = await fetch(
          `http://localhost:8080/api/places/details?placeId=${placeId}`,
        );
        const data = await response.json();
        setPlaceDetails(data);
        setReviews(data.reviews || []);
        setSummary(data.summary || null);
        setSentimentScore(data.sentimentScore ?? null);
      } catch (err) {
        setError("Failed to load business details.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [placeId]);

  function handleClaimClick() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
    } else {
      setShowModal(true);
    }
  }

  async function handleConfirmClaim() {
    setSaving(true);
    setClaimError(null);
    const { error } = await supabase
      .from("businesses")
      .insert({ user_id: user.id, business_name: placeDetails.displayName.text, place_id: placeId });
    if (error) {
      setClaimError("Failed to claim business. Please try again.");
      setSaving(false);
      return;
    }
    navigate('/dashboard');
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>{placeDetails.displayName.text}</h1>
      <p>{placeDetails.formattedAddress}</p>
      <p>{placeDetails.rating} stars</p>

      <button onClick={handleClaimClick}>Claim this Business</button>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '480px', width: '90%' }}>
            <h2>Claim this Business</h2>
            <p style={{ fontSize: '13px', color: '#444', lineHeight: '1.5' }}>
              IMPORTANT DISCLAIMER: RepuFlow is a portfolio project built for educational and demonstration purposes only.
              By claiming this business, you certify that: (1) You are the authorized owner or representative of this business,
              (2) You will not use this platform to send unsolicited messages or spam,
              (3) You will not use this platform to manipulate or fabricate reviews,
              (4) You understand this is a demo application and should not be used for real commercial purposes without proper authorization.
              Misuse of this platform is strictly prohibited.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I have read and agree to the above terms
            </label>
            {claimError && <p style={{ color: 'red', fontSize: '13px' }}>{claimError}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={handleConfirmClaim} disabled={!agreed || saving}>
                {saving ? 'Saving...' : 'Confirm Claim'}
              </button>
              <button onClick={() => { setShowModal(false); setAgreed(false); setClaimError(null); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {sentimentScore !== null && (
        <div style={{ margin: '16px 0' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 'bold' }}>Overall Sentiment</p>
          <div style={{ position: 'relative', height: '16px', borderRadius: '8px', background: 'linear-gradient(to right, #ef4444, #eab308, #22c55e)' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: `${((sentimentScore + 1) / 2) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid #333',
              boxSizing: 'border-box',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#666' }}>
            <span>Negative</span>
            <span>Positive</span>
          </div>
        </div>
      )}

      {summary && (
        <div>
          <h3>AI Summary</h3>
          <p>{summary}</p>
        </div>
      )}

      {reviews.map((review, index) => (
        <div key={index}>
          <p>{review.authorAttribution.displayName}</p>
          <p>{review.rating} stars</p>
          <p>{review.text.text}</p>
        </div>
      ))}
    </div>
  );
}

export default PublicBusinessProfile;
