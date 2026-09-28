import { useEffect, useRef, useState } from "react";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function SearchBar({ onSelectLocation, userLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const timerRef = useRef(null);
  const controllerRef = useRef(null);

  // Dynamic search
  useEffect(() => {
    const text = query.trim();

    clearTimeout(timerRef.current);

    if (text.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    if (!userLocation) {
      setResults([]);
      setError("Please allow your location before searching.");
      return;
    }

    timerRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query, userLocation]);

  const searchPlaces = async (text) => {
    if (!userLocation) return;

    // Cancel previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;

      const { longitude, latitude } = userLocation;

      /*
       * Search around the user's location.
       *
       * Proximity tells Mapbox which area should be preferred.
       * The results are then sorted ourselves using real distance.
       */
      const url =
        `https://api.mapbox.com/search/geocode/v6/forward` +
        `?q=${encodeURIComponent(text)}` +
        `&limit=10` +
        `&proximity=${longitude},${latitude}` +
        `&access_token=${token}`;

      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        setResults([]);
        setError("No locations found.");
        return;
      }

      const formattedResults = data.features
        .map((place) => {
          const coordinates =
            place.geometry?.coordinates;

          if (!coordinates || coordinates.length < 2) {
            return null;
          }

          const placeLongitude = coordinates[0];
          const placeLatitude = coordinates[1];

          const distance = calculateDistance(
            latitude,
            longitude,
            placeLatitude,
            placeLongitude
          );

          return {
            id: place.id,

            geometry: {
              type: "Point",
              coordinates: coordinates,
            },

            properties: {
              name:
                place.properties?.name ||
                place.text ||
                text,

              full_address:
                place.properties?.full_address ||
                place.properties?.place_formatted ||
                place.place_name ||
                "",

              distance: distance,
            },
          };
        })
        .filter(Boolean);

      // Nearest result first
      formattedResults.sort(
        (a, b) =>
          a.properties.distance -
          b.properties.distance
      );

      setResults(formattedResults);
    } catch (error) {
      // Ignore cancelled searches
      if (error.name === "AbortError") {
        return;
      }

      console.error(error);

      setResults([]);
      setError(
        "Unable to search. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (place) => {
    const [longitude, latitude] =
      place.geometry.coordinates;

    onSelectLocation({
      longitude,
      latitude,
      name:
        place.properties.full_address ||
        place.properties.name ||
        "Selected destination",
    });

    setQuery(
      place.properties.name ||
        place.properties.full_address ||
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
        />

        <button
          onClick={() => searchPlaces(query.trim())}
          disabled={loading || query.trim().length < 2}
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((place, index) => (
            <button
              key={place.id}
              className="search-result"
              onClick={() => selectLocation(place)}
            >
              <strong>
                {index === 0 && "📍 "}
                {place.properties.name}
              </strong>

              <span>
                {place.properties.full_address}
                {" • "}
                {place.properties.distance.toFixed(1)} km
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;