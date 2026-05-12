import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

function PublicSearch() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

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

  function handleSelect(suggestion) {
    const placeId = suggestion.placePrediction.placeId;
    setSuggestions([]);
    navigate(`/business/${placeId}`);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg flex flex-col items-center gap-6">

        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-3xl font-bold text-white">REPUFLOW</span>
          <p className="text-sm text-slate-400">Search any business to see their reputation profile</p>
        </div>

        <div className="w-full relative">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search a business name or location..."
              value={searchInput}
              onChange={handleInput}
              className="pl-9 bg-slate-800 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-700 rounded-md overflow-hidden">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placePrediction.placeId}
                  onClick={() => handleSelect(suggestion)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-700 transition-colors duration-100 cursor-pointer border-t border-slate-700 first:border-t-0"
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
        </div>

      </div>
    </div>
  );
}

export default PublicSearch;
