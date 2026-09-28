import { useState } from "react";
import Map from "./components/Map";
import SearchBar from "./components/SearchBar";
import "./App.css";

function App() {
  const [destination, setDestination] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const handleDestination = (location) => {
    setDestination(location);
    setShowRoute(false);
    setRouteInfo(null);
    setRouteLoading(false);
  };

  const clearRoute = () => {
    setShowRoute(false);
    setRouteInfo(null);
    setRouteLoading(false);
  };

  return (
    <div className="app">
      <SearchBar
        onSelectLocation={handleDestination}
        userLocation={userLocation}
      />

      <Map
        destination={destination}
        showRoute={showRoute}
        onRouteInfo={setRouteInfo}
        onRouteLoading={setRouteLoading}
        clearRoute={!showRoute}
        onUserLocation={setUserLocation}
      />

      {destination && !showRoute && (
        <button
          className="route-button"
          onClick={() => setShowRoute(true)}
        >
          🚗 Show Route
        </button>
      )}

      {showRoute && !routeLoading && (
        <button
          className="clear-route-button"
          onClick={clearRoute}
        >
          🧹 Clear Route
        </button>
      )}

      {routeLoading && (
        <div className="route-loading">
          🗺️ Finding route...
        </div>
      )}

      {routeInfo && !routeLoading && (
        <div className="route-info">
          <h3>Route Information</h3>
          <p>📍 Distance: {routeInfo.distance} km</p>
          <p>⏱️ Estimated time: {routeInfo.duration} min</p>
        </div>
      )}
    </div>
  );
}

export default App;