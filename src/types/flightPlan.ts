export interface Waypoint {
  id: string;
  name: string;
  icao?: string;
  lat: number;
  lng: number;
  altitude?: number; // feet
  hasCustoms?: boolean;
  hasFuel?: boolean;
  country?: string;
  notes?: string;
}

export interface FlightLeg {
  id: string;
  from: Waypoint;
  to: Waypoint;
  distanceNm: number;
  bearing: number; // magnetic heading
  groundSpeed: number; // knots
  estimatedTimeMin: number;
  fuelBurnRate: number; // liters/hour or kg/hour
  estimatedFuel: number;
  altitudeFt: number;
  windDir?: number;
  windSpeed?: number;
  customsRequired: boolean;
  notes: string;
}

export interface FlightPlan {
  id: string;
  name: string;
  date: string;
  aircraftType: string;
  aircraftReg: string;
  pilotInCommand: string;
  legs: FlightLeg[];
  waypoints: Waypoint[];
  defaultGroundSpeed: number;
  defaultFuelBurnRate: number;
  fuelOnBoard: number; // liters
  reserveFuel: number; // liters
  totalDistanceNm: number;
  totalTimeMin: number;
  totalFuelRequired: number;
  customsStops: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const emptyFlightPlan: Omit<FlightPlan, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  date: new Date().toISOString().split('T')[0],
  aircraftType: '',
  aircraftReg: '',
  pilotInCommand: '',
  legs: [],
  waypoints: [],
  defaultGroundSpeed: 90,
  defaultFuelBurnRate: 120,
  fuelOnBoard: 0,
  reserveFuel: 0,
  totalDistanceNm: 0,
  totalTimeMin: 0,
  totalFuelRequired: 0,
  customsStops: [],
  notes: '',
};

// Calculate distance between two coordinates in nautical miles
export function calcDistanceNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth radius in NM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate bearing between two coordinates
export function calcBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}
