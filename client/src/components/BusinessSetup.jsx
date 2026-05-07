import { useState } from "react";

function BusinessSetup() {
    const [searchInput, setSearchInput] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [selected, setSelected] = useState(null)

    async function fetchSuggestions(input) {
        if (input.length < 3) {
            setSuggestions([])
            return
        }
        try {
            const response = await fetch(
                `http://localhost:8080/api/places/search?input=${encodeURIComponent(input)}`
            )
            const data = await response.json()
            setSuggestions(data.suggestions || [])
        } catch (error) {
            console.error('Failed to fetch suggestions:', error)
        }
    }

    function handleInput(e) {
        const value = e.target.value
        setSearchInput(value)
        fetchSuggestions(value)
    }

    function handleSelect(suggestion) {
        setSelected({
            name: suggestion.placePrediction.text.text,
            placeId: suggestion.placePrediction.placeId
        })
        setSearchInput(suggestion.description)
        setSuggestions([])
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
            {selected && (
                <p>Selected: {selected.name}</p>
            )}
        </div>
    )

}

export default BusinessSetup