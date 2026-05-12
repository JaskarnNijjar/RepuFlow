import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm ${i <= Math.round(rating) ? "text-yellow-400" : "text-slate-700"}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function SentimentBadge({ sentiment }) {
  if (sentiment === "positive")
    return <Badge variant="outline" className="bg-green-900 text-green-400 border border-green-800">Positive</Badge>;
  if (sentiment === "negative")
    return <Badge variant="outline" className="bg-red-900 text-red-400 border border-red-800">Negative</Badge>;
  return <Badge variant="outline" className="bg-yellow-900 text-yellow-400 border border-yellow-800">Neutral</Badge>;
}

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

  const [hasBusiness, setHasBusiness] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimError, setClaimError] = useState(null);

  useEffect(() => {
    if (!user) return;
    async function checkBusiness() {
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (data) setHasBusiness(true);
    }
    checkBusiness();
  }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const markerPosition = sentimentScore !== null ? ((sentimentScore + 1) / 2) * 100 : 50;

  return (
    <div className="min-h-screen bg-[#0f172a]">

      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-lg font-bold text-white focus:outline-none">
            REPUFLOW
          </button>
          <div className="flex items-center gap-4">
            {user && hasBusiness && (
              <button
                onClick={() => navigate('/customers')}
                className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
              >
                Review Requests
              </button>
            )}
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-4">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">
            {placeDetails.displayName.text}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-sm">
            <span>{placeDetails.formattedAddress}</span>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <StarRating rating={placeDetails.rating} />
              <span className="text-slate-300 font-medium">{placeDetails.rating}</span>
            </div>
          </div>
        </div>

        {sentimentScore !== null && (
          <Card className="bg-slate-800 border border-slate-700 rounded-md">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-slate-200 text-base font-semibold">Overall sentiment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative h-2 rounded-full overflow-visible bg-linear-to-r from-red-500 via-yellow-500 to-green-500">
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-900 shadow"
                  style={{ left: `${markerPosition}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-slate-400">
                <span>Negative</span>
                <span>Positive</span>
              </div>
            </CardContent>
          </Card>
        )}

        {summary && (
          <Card className="bg-slate-800 border border-slate-700 rounded-md">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-slate-200 text-base font-semibold">AI summary</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
            </CardContent>
          </Card>
        )}

        {reviews.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((review, index) => (
                <Card key={index} className="bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors duration-150">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-slate-200 text-sm font-medium mb-1">
                          {review.authorAttribution.displayName}
                        </p>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.sentiment && <SentimentBadge sentiment={review.sentiment} />}
                    </div>
                    <Separator className="bg-slate-700 mb-3" />
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-4">
                      {review.text.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={handleClaimClick}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Claim this Business
          </Button>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-md">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-slate-100 text-lg font-semibold">Claim this business</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-4">
              <p className="text-slate-400 text-sm leading-relaxed">
                IMPORTANT DISCLAIMER: RepuFlow is a portfolio project built for educational and demonstration purposes only.
                By claiming this business, you certify that: (1) You are the authorized owner or representative of this business,
                (2) You will not use this platform to send unsolicited messages or spam,
                (3) You will not use this platform to manipulate or fabricate reviews,
                (4) You understand this is a demo application and should not be used for real commercial purposes without proper authorization.
                Misuse of this platform is strictly prohibited.
              </p>
              <Separator className="bg-slate-700" />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-slate-300 text-sm">I have read and agree to the above terms</span>
              </label>
              {claimError && <p className="text-red-400 text-sm">{claimError}</p>}
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmClaim}
                  disabled={!agreed || saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Confirm claim"}
                </Button>
                <button
                  onClick={() => { setShowModal(false); setAgreed(false); setClaimError(null); }}
                  className="text-slate-400 hover:text-slate-200 text-sm transition-colors px-3"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

export default PublicBusinessProfile;
