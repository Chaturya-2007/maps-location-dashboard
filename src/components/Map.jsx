import { useEffect, useRef } from "react";
import * as mapboxgl from "mapbox-gl/esm";
import "mapbox-gl/dist/mapbox-gl.css";

function Map({
  destination,
  showRoute,
  onRouteInfo,
  onRouteLoading,
  clearRoute,
  onUserLocation,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const userLocationRef = useRef(null);

  // Create map
  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [78.4867, 17.3850],
      zoom: 10,
    });

    mapRef.current.addControl(
      new mapboxgl.NavigationControl(),
      "top-right"
    );

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: false,
      showUserHeading: false,
    });

    mapRef.current.addControl(geolocate, "top-right");

    // Get user's current location
    geolocate.on("geolocate", (event) => {
      const location = {
        longitude: event.coords.longitude,
        latitude: event.coords.latitude,
      };

      userLocationRef.current = [
        location.longitude,
        location.latitude,
      ];

      // Send location to App.jsx
      onUserLocation(location);
    });

    // Location error
    geolocate.on("error", () => {
      alert(
        "Unable to access your location. Please allow location permission and try again."
      );
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [onUserLocation]);

  // Destination marker
  useEffect(() => {
    if (!mapRef.current || !destination) return;

    // Remove previous marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
    }

    // Create a clearly visible destination marker
    const markerElement = document.createElement("div");

    markerElement.style.width = "24px";
    markerElement.style.height = "24px";
    markerElement.style.backgroundColor = "#dc2626";
    markerElement.style.border = "4px solid white";
    markerElement.style.borderRadius = "50%";
    markerElement.style.boxShadow =
      "0 2px 8px rgba(0, 0, 0, 0.4)";

    destinationMarkerRef.current = new mapboxgl.Marker({
      element: markerElement,
      anchor: "center",
    })
      .setLngLat([
        destination.longitude,
        destination.latitude,
      ])
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [
        destination.longitude,
        destination.latitude,
      ],
      zoom: 14,
      essential: true,
    });
  }, [destination]);

  // Clear route
  useEffect(() => {
    if (!clearRoute || !mapRef.current) return;

    if (mapRef.current.getLayer("route")) {
      mapRef.current.removeLayer("route");
    }

    if (mapRef.current.getSource("route")) {
      mapRef.current.removeSource("route");
    }

    onRouteInfo(null);
  }, [clearRoute, onRouteInfo]);

  // Draw route
  useEffect(() => {
    if (!showRoute || !destination || !mapRef.current) {
      return;
    }

    const getRoute = async () => {
      onRouteLoading(true);
      onRouteInfo(null);

      try {
        // Check user's location
        if (!userLocationRef.current) {
          alert(
            "Your current location is not available. Please click the location button first."
          );

          return;
        }

        const origin = userLocationRef.current;

        const destinationCoords = [
          destination.longitude,
          destination.latitude,
        ];

        const token = import.meta.env.VITE_MAPBOX_TOKEN;

        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${origin[0]},${origin[1]};` +
          `${destinationCoords[0]},${destinationCoords[1]}` +
          `?alternatives=true` +
          `&overview=full` +
          `&geometries=geojson` +
          `&steps=true` +
          `&access_token=${token}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Route request failed");
        }

        const data = await response.json();

        // No route found
        if (!data.routes || data.routes.length === 0) {
          alert("No route could be found for this destination.");
          return;
        }

        /*
          Mapbox normally returns routes ordered by recommended
          route. We select the route with the shortest distance
          when multiple alternatives are available.
        */
        const route = data.routes.reduce(
          (shortest, current) => {
            return current.distance < shortest.distance
              ? current
              : shortest;
          },
          data.routes[0]
        );

        // Distance and duration
        const distance = (route.distance / 1000).toFixed(2);
        const duration = Math.round(route.duration / 60);

        onRouteInfo({
          distance,
          duration,
        });

        // Route GeoJSON
        const routeGeoJSON = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };

        // Add or update route
        if (mapRef.current.getSource("route")) {
          mapRef.current
            .getSource("route")
            .setData(routeGeoJSON);
        } else {
          mapRef.current.addSource("route", {
            type: "geojson",
            data: routeGeoJSON,
          });

          mapRef.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#2563eb",
              "line-width": 6,
            },
          });
        }

        // Fit map to route
        const coordinates = route.geometry.coordinates;

        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds, coordinate) => {
              return bounds.extend(coordinate);
            },
            new mapboxgl.LngLatBounds(
              coordinates[0],
              coordinates[0]
            )
          );

          mapRef.current.fitBounds(bounds, {
            padding: 80,
            maxZoom: 15,
          });
        }
      } catch (error) {
        console.error(error);

        onRouteInfo(null);

        alert(
          "Unable to find a route. Please check your internet connection and try again."
        );
      } finally {
        onRouteLoading(false);
      }
    };

    getRoute();
  }, [
    showRoute,
    destination,
    onRouteInfo,
    onRouteLoading,
  ]);

  return (
    <div
      ref={mapContainerRef}
      className="map-container"
    />
  );
}

export default Map;