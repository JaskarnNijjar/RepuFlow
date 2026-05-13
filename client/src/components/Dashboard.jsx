import supabase from "../supabase";
import BusinessSetup from "./BusinessSetup";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [rLoading, setRLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sentimentScore, setSentimentScore] = useState(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setBusinesses(data);
          const savedId = localStorage.getItem("activeBusinessId");
          const match = savedId ? data.find((b) => b.id === savedId) : null;
          setActiveBusiness(match || data[0]);
        } else {
          setBusinesses([]);
          setActiveBusiness(null);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [user]);

  useEffect(() => {
    async function fetchReviews() {
      if (!activeBusiness) return;
      setRLoading(true);
      setErr(null);
      try {
        const response = await fetch(
          `http://localhost:8080/api/places/details?placeId=${activeBusiness.place_id}`,
        );
        const data = await response.json();
        setReviews(data.reviews || []);
        setSummary(data.summary || null);
        setSentimentScore(data.sentimentScore ?? null);
      } catch {
        setErr("Failed to fetch reviews");
      } finally {
        setRLoading(false);
      }
    }

    fetchReviews();
  }, [activeBusiness]);

  function handleBusinessSwitch(businessId) {
    const selected = businesses.find((b) => b.id === businessId);
    if (selected && selected.id !== activeBusiness?.id) {
      localStorage.setItem("activeBusinessId", businessId);
      setReviews([]);
      setSummary(null);
      setSentimentScore(null);
      setActiveBusiness(selected);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <BusinessSetup
        onBusinessSaved={(saved) => {
          setBusinesses([saved]);
          setActiveBusiness(saved);
        }}
      />
    );
  }

  const markerPosition = ((sentimentScore + 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a]">

      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-lg font-bold text-white focus:outline-none">
            REPUFLOW
          </button>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/search")}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors px-3 py-2"
            >
              Search Businesses
            </button>
            <button
              onClick={() => navigate("/businesses")}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors px-3 py-2"
            >
              My Businesses
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors px-3 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-4">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">{activeBusiness.business_name}</h1>
          <p className="text-sm text-slate-400">Your reputation dashboard</p>
        </div>

        {businesses.length > 1 && (
          <div className="relative w-fit">
            {switcherOpen && (
              <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)} />
            )}
            <button
              onClick={() => setSwitcherOpen((o) => !o)}
              className="relative z-20 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-100 text-sm rounded-lg px-4 py-2 transition-colors"
            >
              <span>{activeBusiness.business_name}</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`text-slate-400 transition-transform ${switcherOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {switcherOpen && (
              <div className="absolute z-20 top-full mt-1 left-0 min-w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { handleBusinessSwitch(b.id); setSwitcherOpen(false); }}
                    className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-slate-700 ${
                      b.id === activeBusiness.id ? "text-blue-400" : "text-slate-300"
                    }`}
                  >
                    {b.id === activeBusiness.id && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span className={b.id !== activeBusiness.id ? "pl-5" : ""}>{b.business_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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

        {rLoading && <p className="text-slate-400 text-sm animate-pulse">Loading reviews...</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}

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

      </div>
    </div>
  );
}

export default Dashboard;
