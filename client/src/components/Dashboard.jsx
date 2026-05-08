import supabase from "../supabase";
import BusinessSetup from "./BusinessSetup";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

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
    )
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      <p>Business: {business.business_name}</p>
      <p>Place ID: {business.place_id}</p>
    </div>
  );
}

export default Dashboard;
