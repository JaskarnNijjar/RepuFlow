import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div>
      <h1>Search for a Business</h1>
      <input
        type="text"
        placeholder="Search for a business..."
        value={searchInput}
        onChange={handleInput}
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.placePrediction.placeId}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.placePrediction.text.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PublicSearch;
