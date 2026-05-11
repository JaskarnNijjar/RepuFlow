import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function PublicBusinessProfile() {
  const { placeId } = useParams();
  const [placeDetails, setPlaceDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sentimentScore, setSentimentScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>{placeDetails.displayName.text}</h1>
      <p>{placeDetails.formattedAddress}</p>
      <p>{placeDetails.rating} stars</p>

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
