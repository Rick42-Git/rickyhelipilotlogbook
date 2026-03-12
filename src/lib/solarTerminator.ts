/**
 * Solar terminator calculation for Leaflet overlay.
 * Calculates the day/night boundary on Earth based on solar position.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Calculate the subsolar point (lat/lng where the sun is directly overhead) */
function getSubsolarPoint(date: Date): { lat: number; lng: number } {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const epsilon = 23.439 * RAD - 0.0000004 * RAD * n;
  const decl = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) * DEG;

  // Equation of time (minutes)
  const eqTime = ((L - (Math.atan2(Math.sin(lambda) * Math.cos(epsilon), Math.cos(lambda)) * DEG) + 180) % 360 - 180) * 4;
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lng = -(hours - 12) * 15 - eqTime / 4;

  return { lat: decl, lng: ((lng + 540) % 360) - 180 };
}

/** Generate polygon coordinates for the night side of Earth */
export function getNightPolygon(date: Date = new Date()): [number, number][] {
  const { lat: sunLat, lng: sunLng } = getSubsolarPoint(date);
  const points: [number, number][] = [];

  // Generate the terminator line
  for (let i = 0; i <= 360; i++) {
    const lng = -180 + i;
    const cosLng = Math.cos((lng - sunLng) * RAD);
    const lat = Math.atan(-cosLng / Math.tan(sunLat * RAD)) * DEG;
    points.push([lat, lng]);
  }

  // Close the polygon on the night side
  // If sun is in northern hemisphere, night is towards south pole
  const nightLat = sunLat >= 0 ? -90 : 90;

  // Add corners to close the polygon
  const polygon: [number, number][] = [];
  polygon.push([nightLat, -180]);
  for (const p of points) {
    polygon.push(p);
  }
  polygon.push([nightLat, 180]);
  polygon.push([nightLat, -180]); // close

  return polygon;
}

/** Get sunrise/sunset info for a specific location */
export function getSunTimes(lat: number, lng: number, date: Date = new Date()): {
  isDaytime: boolean;
  sunAltitude: number;
} {
  const { lat: sunLat, lng: sunLng } = getSubsolarPoint(date);

  // Calculate solar altitude angle
  const hourAngle = (lng - sunLng) * RAD;
  const sinAlt = Math.sin(lat * RAD) * Math.sin(sunLat * RAD) +
    Math.cos(lat * RAD) * Math.cos(sunLat * RAD) * Math.cos(hourAngle);
  const altitude = Math.asin(sinAlt) * DEG;

  return {
    isDaytime: altitude > 0,
    sunAltitude: altitude,
  };
}
