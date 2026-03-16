export interface FrequencyRow {
  id: number;
  airport_ident: string;
  type: string;
  description: string;
  frequency_mhz: number;
}

export interface AirportRow {
  id: number;
  ident: string;
  type: string;
  name: string;
  latitude_deg: number | null;
  longitude_deg: number | null;
  elevation_ft: number | null;
  municipality: string;
  iso_country: string;
  icao_code: string;
  iata_code: string;
}

export interface RunwayRow {
  id: number;
  airport_ident: string;
  length_ft: number | null;
  width_ft: number | null;
  surface: string;
  lighted: boolean;
  closed: boolean;
  le_ident: string;
  he_ident: string;
  le_heading_degt: number | null;
  he_heading_degt: number | null;
}

export interface NavaidRow {
  id: number;
  ident: string;
  name: string;
  type: string;
  frequency_khz: number | null;
  elevation_ft: number | null;
  associated_airport: string;
  power: string;
}

export interface AirportGroup {
  freqs: FrequencyRow[];
  airport?: AirportRow;
  rwys: RunwayRow[];
  navs: NavaidRow[];
}
