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

  // Instrument Flying
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
  instrumentTime: 0,
  instructorDay: 0,
  instructorNight: 0,
};

export type NumericField =
  | 'seDayDual' | 'seDayPilot'
  | 'seNightDual' | 'seNightPilot'
  | 'instrumentTime'
  | 'instructorDay' | 'instructorNight';

export const numericFieldLabels: Record<NumericField, string> = {
  seDayDual: 'SE Day Dual',
  seDayPilot: 'SE Day Pilot',
  seNightDual: 'SE Night Dual',
  seNightPilot: 'SE Night Pilot',
  instrumentTime: 'Instr Time',
  instructorDay: 'Instructor Day',
  instructorNight: 'Instructor Night',
};
