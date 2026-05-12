import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import supabase from "../supabase";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function BusinessSetup({ onBusinessSaved }) {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSuggestions(input) {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8080/api/places/search?input=${encodeURIComponent(input)}`,
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  }

  function handleInput(e) {
    const value = e.target.value;
    setSearchInput(value);
    fetchSuggestions(value);
  }

  async function handleSelect(suggestion) {
    const name = suggestion.placePrediction.text.text;
    const placeId = suggestion.placePrediction.placeId;

    setSearchInput(name);
    setSuggestions([]);
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("businesses")
      .insert({ user_id: user.id, business_name: name, place_id: placeId })
      .select()
      .single();

    if (error) {
      setError("Failed to save business. Please try again.");
      setSaving(false);
      return;
    }

    onBusinessSaved(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">

      <nav className="bg-[#0f172a] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-white">REPUFLOW</span>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col gap-6">

          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-slate-100">Find your business</h1>
            <p className="text-sm text-slate-400">Search to connect your Google listing</p>
          </div>

          <Card className="bg-slate-800 border border-slate-700 rounded-md">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-slate-300 text-sm font-medium">Business search</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-0">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="Search your business name..."
                  value={searchInput}
                  onChange={handleInput}
                  className="pl-9 bg-slate-900 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
                />
              </div>

              {suggestions.length > 0 && (
                <div className="mt-1 bg-slate-900 border border-slate-600 rounded-md overflow-hidden">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.placePrediction.placeId}
                      onClick={() => handleSelect(suggestion)}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-800 transition-colors duration-100 cursor-pointer border-t border-slate-700 first:border-t-0"
                    >
                      <svg className="shrink-0 text-slate-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="text-sm text-slate-300 truncate">
                        {suggestion.placePrediction.text.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {saving && <p className="text-slate-400 text-sm mt-3">Saving your business...</p>}
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

export default BusinessSetup;
