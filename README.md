# Maps Location Dashboard

A simple web dashboard that integrates Mapbox Maps, browser geolocation, destination search, and route directions.

## Features

- Interactive Mapbox map
- Detects the user's current location
- Browser location permission handling
- Search for destinations
- Destination marker
- Zoom and pan controls
- Route from current location to destination
- Distance calculation
- Estimated travel time
- Route loading state
- Error handling
- Clear route
- Select another destination without refreshing the page

## Technologies Used

- React
- Vite
- JavaScript
- Mapbox GL JS
- Mapbox Search API
- Mapbox Directions API
- Browser Geolocation API
- CSS

## Project Structure

```text
maps-location-dashboard/
├── src/
│   ├── components/
│   │   ├── Map.jsx
│   │   └── SearchBar.jsx
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── public/
├── .env
├── .gitignore
├── package.json
└── README.md