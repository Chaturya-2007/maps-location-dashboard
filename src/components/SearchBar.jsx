import { useState } from "react";

function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchLocation = async () => {
    if (!query.trim()) {
      setError("Please enter a destination.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;

      const url =
        `https://api.mapbox.com/search/geocode/v6/forward` +
        `?q=${encodeURIComponent(query)}` +
        `&limit=5` +
        `&access_token=${token}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        setError("No locations found. Try another search.");
        return;
      }

      setResults(data.features);
    } catch (error) {
      console.error(error);
      setError("Unable to search. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (place) => {
    const [longitude, latitude] = place.geometry.coordinates;

    onSelectLocation({
      longitude,
      latitude,
      name:
        place.properties.full_address ||
        place.properties.name ||
        "Selected destination",
    });

    setQuery(
      place.properties.full_address ||
        place.properties.name ||
        "Selected destination"
    );

    setResults([]);
    setError("");
  };

  return (
    <div className="search-container">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search for a destination..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              searchLocation();
            }
          }}
        />

        <button onClick={searchLocation} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((place) => (
            <button
              key={place.id}
              className="search-result"
              onClick={() => selectLocation(place)}
            >
              <strong>
                {place.properties.name}
              </strong>

              <span>
                {place.properties.full_address ||
                  place.properties.place_formatted ||
                  ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;