export interface LogbookEntry {
  id: string;
  date: string;
  aircraftType: string;
  aircraftReg: string;
  pilotInCommand: string;
  flightDetails: string;

  // Single Engine Aircraft — Day
  seDayDual: number;    // Col 1
  seDayPilot: number;   // Col 2

  // Single Engine Aircraft — Night
  seNightDual: number;  // Col 3
  seNightPilot: number; // Col 4

  // Multi-Engine Aircraft — Day
  meDayDual: number;    // Col 5
  meDayPilot: number;   // Col 6
  meDayCoPilot: number; // Col 7

  // Multi-Engine Aircraft — Night
  meNightDual: number;  // Col 8
  meNightPilot: number; // Col 9
  meNightCoPilot: number; // Col 10

  // Instrument Flying
  instrumentNavAids: number; // Col 11
  instrumentPlace: number;   // Col 12
  instrumentTime: number;    // Col 13

  // Flying as Instructor
  instructorDay: number;   // Col 14
  instructorNight: number; // Col 15
}

export const emptyEntry: Omit<LogbookEntry, 'id'> = {
  date: '',
  aircraftType: '',
  aircraftReg: '',
  pilotInCommand: '',
  flightDetails: '',
  seDayDual: 0,
  seDayPilot: 0,
  seNightDual: 0,
  seNightPilot: 0,
  meDayDual: 0,
  meDayPilot: 0,
  meDayCoPilot: 0,
  meNightDual: 0,
  meNightPilot: 0,
  meNightCoPilot: 0,
  instrumentNavAids: 0,
  instrumentPlace: 0,
  instrumentTime: 0,
  instructorDay: 0,
  instructorNight: 0,
};

export type NumericField =
  | 'seDayDual' | 'seDayPilot'
  | 'seNightDual' | 'seNightPilot'
  | 'meDayDual' | 'meDayPilot' | 'meDayCoPilot'
  | 'meNightDual' | 'meNightPilot' | 'meNightCoPilot'
  | 'instrumentNavAids' | 'instrumentPlace' | 'instrumentTime'
  | 'instructorDay' | 'instructorNight';

export const numericFieldLabels: Record<NumericField, string> = {
  seDayDual: 'SE Day Dual',
  seDayPilot: 'SE Day Pilot',
  seNightDual: 'SE Night Dual',
  seNightPilot: 'SE Night Pilot',
  meDayDual: 'ME Day Dual',
  meDayPilot: 'ME Day Pilot',
  meDayCoPilot: 'ME Day Co-Pilot',
  meNightDual: 'ME Night Dual',
  meNightPilot: 'ME Night Pilot',
  meNightCoPilot: 'ME Night Co-Pilot',
  instrumentNavAids: 'Instr Nav Aids',
  instrumentPlace: 'Instr Place',
  instrumentTime: 'Instr Time',
  instructorDay: 'Instructor Day',
  instructorNight: 'Instructor Night',
};
