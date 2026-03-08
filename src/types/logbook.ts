export interface LogbookEntry {
  id: string;
  date: string;
  aircraftType: string;
  aircraftReg: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  totalTime: number;
  picTime: number;
  sicTime: number;
  dualTime: number;
  nightTime: number;
  ifrTime: number;
  crossCountry: number;
  landings: number;
  remarks: string;
}

export const emptyEntry: Omit<LogbookEntry, 'id'> = {
  date: '',
  aircraftType: '',
  aircraftReg: '',
  from: '',
  to: '',
  departureTime: '',
  arrivalTime: '',
  totalTime: 0,
  picTime: 0,
  sicTime: 0,
  dualTime: 0,
  nightTime: 0,
  ifrTime: 0,
  crossCountry: 0,
  landings: 0,
  remarks: '',
};

export type NumericField = 'totalTime' | 'picTime' | 'sicTime' | 'dualTime' | 'nightTime' | 'ifrTime' | 'crossCountry' | 'landings';

export const numericFieldLabels: Record<NumericField, string> = {
  totalTime: 'Total Time',
  picTime: 'PIC',
  sicTime: 'SIC',
  dualTime: 'Dual',
  nightTime: 'Night',
  ifrTime: 'IFR',
  crossCountry: 'XC',
  landings: 'Landings',
};
