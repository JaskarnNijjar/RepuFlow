import supabase from "../supabase";
import BusinessSetup from "./BusinessSetup";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [rLoading, setRLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sentimentScore, setSentimentScore] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cSaving, setCSaving] = useState(false);
  const [sendingStates, setSendingStates] = useState({});

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) setBusiness(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [user]);

  useEffect(() => {
    async function fetchReviews() {
      console.log("fetchReviews called, business:", business);
      if (!business) return;
      setRLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8080/api/places/details?placeId=${business.place_id}`,
        );
        const data = await response.json();
        console.log("reviews data:", data);
        console.log('summary:', data.summary)
        console.log('sentiment score:', data.sentimentScore)
        setReviews(data.reviews || []);
        setSummary(data.summary || null);
        setSentimentScore(data.sentimentScore ?? null);
      } catch (err) {
        setErr("Failed to fetch reviews");
      } finally {
        setRLoading(false);
      }
    }

    fetchReviews();
  }, [business]);

  useEffect(() => {
    if (!business) return;
    async function fetchCustomers() {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", business.id);
      if (data) setCustomers(data);
    }
    fetchCustomers();
  }, [business]);

  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    setCSaving(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({ business_id: business.id, customer_name: customerName, customer_phone: customerPhone })
      .select()
      .single();
    if (!error && data) {
      setCustomers((prev) => [...prev, data]);
      setCustomerName("");
      setCustomerPhone("");
    }
    setCSaving(false);
  }

  async function handleSendReviewRequest(customer) {
    setSendingStates((prev) => ({ ...prev, [customer.id]: 'sending' }));
    try {
      const response = await fetch('http://localhost:8080/api/sms/send-review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: customer.customer_phone,
          customerName: customer.customer_name,
          businessName: business.business_name,
          placeId: business.place_id,
          business_id: business.id,
          customer_id: customer.id,
        }),
      });
      if (!response.ok) throw new Error();
      setSendingStates((prev) => ({ ...prev, [customer.id]: 'sent' }));
      setTimeout(() => setSendingStates((prev) => ({ ...prev, [customer.id]: null })), 3000);
    } catch {
      setSendingStates((prev) => ({ ...prev, [customer.id]: 'error' }));
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleChangeBusiness() {
    await supabase.from("businesses").delete().eq("id", business.id);
    setBusiness(null);
    setReviews([]);
    setSummary(null);
    setSentimentScore(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!business) {
    return <BusinessSetup onBusinessSaved={setBusiness} />;
  }

  const markerPosition = ((sentimentScore + 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a]">

      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-white">REPUFLOW</span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleChangeBusiness}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Change business
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-4">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">{business.business_name}</h1>
          <p className="text-sm text-slate-400">Your reputation dashboard</p>
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

        <Card className="bg-slate-800 border border-slate-700 rounded-md">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-slate-200 text-base font-semibold">Customers</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex flex-col gap-4">

            <form onSubmit={handleAddCustomer} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <Label className="text-slate-400 text-sm font-medium">Name</Label>
                  <Input
                    type="text"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <Label className="text-slate-400 text-sm font-medium">Phone</Label>
                  <Input
                    type="text"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={cSaving}
                className="self-start bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-40"
              >
                {cSaving ? "Saving..." : "Add customer"}
              </Button>
            </form>

            {customers.length > 0 && (
              <>
                <Separator className="bg-slate-700" />
                <div className="flex flex-col gap-1">
                  {customers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-4 py-2">
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{c.customer_name}</p>
                        <p className="text-slate-400 text-xs">{c.customer_phone}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {sendingStates[c.id] === 'sent' && (
                          <span className="text-green-400 text-xs">Request sent!</span>
                        )}
                        {sendingStates[c.id] === 'error' && (
                          <span className="text-red-400 text-xs">Failed. Try again.</span>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleSendReviewRequest(c)}
                          disabled={sendingStates[c.id] === 'sending'}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-40"
                        >
                          {sendingStates[c.id] === 'sending' ? 'Sending...' : 'Send review request'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default Dashboard;
