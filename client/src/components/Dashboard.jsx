import supabase from "../supabase";
import BusinessSetup from "./BusinessSetup";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [rLoading, setRLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [summary, setSummary] = useState(null);

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
      } catch (err) {
        setErr("Failed to fetch reviews");
      } finally {
        setRLoading(false);
      }
    }

    fetchReviews();
  }, [business]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return <p>Loading...</p>;

  if (!business) {
    return (
      <div>
        <button onClick={handleLogout}>Logout</button>
        <BusinessSetup onBusinessSaved={setBusiness} />
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      <p>Business: {business.business_name}</p>

      {rLoading && <p>Loading reviews...</p>}
      {err && <p>{err}</p>}

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

export default Dashboard;
