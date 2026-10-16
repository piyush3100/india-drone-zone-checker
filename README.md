# India Drone Zone Checker (React)

A runnable React + Vite prototype for searching drone airspace by Indian city or by latitude/longitude with a configurable radius (default 2 km).

## Important data disclaimer

This project is a **UI and geospatial-search prototype**, not a source of current legal flight authorization. It uses:
- OpenStreetMap tiles for the base map.
- OpenStreetMap Nominatim for city geocoding (internet connection required; respect its usage policy).
- Clearly labelled **illustrative demo features** for no-fly areas and airport markers. Demo shapes are not official DigitalSky data and must not be used to make flight decisions.

It does not scrape DigitalSky, bypass access controls, or pretend to have live government airspace data. Before production, connect a data provider you are authorized to use (for example, an approved DigitalSky integration or a provider with licensed airspace geometry/API access). Check the current API terms, access requirements, and data freshness.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

For a production build:

```bash
npm run build
npm run preview
```

## Features
- Search by city (geocoded with Nominatim).
- Advanced coordinate search, default 2 km radius (adjustable from 0.5–10 km).
- Map marker, radius circle, demo zone overlays, and nearby demo points.
- Results list with distances and category labels.
- Validation for latitude/longitude.
- Clear demo-data warning on screen.

## Connect real airspace data

Implement a server-side adapter rather than putting secret API credentials in the React bundle. A recommended backend contract is:

`GET /api/airspace/nearby?lat=18.5204&lon=73.8567&radiusKm=2`

Example response:

```json
{
  "source": "Authorized provider name",
  "updatedAt": "2026-10-16T00:00:00Z",
  "features": [
    {
      "id": "zone-123",
      "name": "Example restricted area",
      "category": "restricted",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.85,18.52],[73.86,18.52],[73.86,18.53],[73.85,18.53],[73.85,18.52]]]
      },
      "sourceUrl": "https://official-source.example"
    }
  ]
}
```

Use GeoJSON coordinates in `[longitude, latitude]` order. Implement this endpoint on a backend after verifying provider permissions and data semantics. A map layer alone may not expose polygons as structured JSON. Never treat an absence of matching records as legal permission to fly.

## Suggested next steps
1. Confirm the authorized source/API and its access terms.
2. Add a backend adapter that normalizes its data to GeoJSON.
3. Validate data timestamps and show source citations per zone.
4. Add country-specific rules, altitude constraints, NOTAM/temporary restrictions, and fail-closed handling when data is unavailable.
