import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import supabase from "../supabase";

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

    console.log('user:', user)

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        business_name: name,
        place_id: placeId,
      })
      .select()
      .single();

    console.log("data:", data);
    console.log("error:", error);

    if (error) {
      setError("Failed to save business. Please try again.");
      setSaving(false);
      return;
    }

    onBusinessSaved(data);
  }

  return (
    <div>
      <h2>Find your business</h2>
      <input
        type="text"
        placeholder="Search your business name..."
        value={searchInput}
        onChange={handleInput}
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.placePrediction.placeId}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.placePrediction.text.text}
            </li>
          ))}
        </ul>
      )}
      {saving && <p>Saving your business...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default BusinessSetup;
