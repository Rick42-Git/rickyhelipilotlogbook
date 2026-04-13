/**
 * Comprehensive ICAO-based aircraft categorization.
 * Categories: Helicopter Piston, Helicopter Turbine, Fixed-Wing Piston, Fixed-Wing Turbine, Simulator
 */

export type AircraftCategory = 'heli_piston' | 'heli_turbine' | 'fw_piston' | 'fw_turbine' | 'simulator' | 'unknown';

export const CATEGORY_LABELS: Record<AircraftCategory, string> = {
  heli_piston: 'Helicopter — Piston',
  heli_turbine: 'Helicopter — Turbine',
  fw_piston: 'Fixed-Wing — Piston',
  fw_turbine: 'Fixed-Wing — Turbine',
  simulator: 'Simulator / FSTD',
  unknown: 'Other',
};

export const CATEGORY_SHORT: Record<AircraftCategory, string> = {
  heli_piston: 'Heli Piston',
  heli_turbine: 'Heli Turbine',
  fw_piston: 'FW Piston',
  fw_turbine: 'FW Turbine',
  simulator: 'Sim / FSTD',
  unknown: 'Other',
};

// Simulators
const SIMULATOR_CODES = new Set([
  'FNTP II', 'FSTD I', 'FSTD II', 'FNTPII', 'FSTDI', 'FSTDII',
  'FNTP-II', 'FSTD-I', 'FSTD-II', 'FNTP 2', 'FSTD 1', 'FSTD 2',
  'FNTP2', 'FSTD1', 'FSTD2', 'SIM', 'FTD', 'SIMULATOR',
  'FNPT II', 'FNPT-II', 'FNPT2', 'FNPTII', 'FNPT 2',
]);

// Helicopter — Piston
const HELI_PISTON_CODES = new Set([
  'R22', 'RH22', 'RH-22', 'R-22', 'R 22', 'RH 22',
  'R44', 'RH44', 'RH-44', 'R-44', 'R 44', 'RH 44',
  'H269', 'S269', 'S300', 'S-300', '269', '300C', '300CB', '300CBI',
  'CABR', 'G2CA',
  'EN28', 'E28F', 'EN480',
  'B47G', 'B47J', 'B47',
  'BRB2', 'BR2B',
  'UH12', 'H12B', 'H12E',
  'EXEC',
  'SAF2',
  'S52',
  'HU44',
  'SYCA',
  'SKYL',
  'RWAY',
  'G2GB', 'B47G2',
]);

// Helicopter — Turbine
const HELI_TURBINE_CODES = new Set([
  'GAZL', 'GAZ', 'GAZELLE', 'SA341', 'SA342', 'SA 341', 'SA 342', 'SA-341', 'SA-342',
  'UH1', 'UH-1', 'UH1H', 'UH-1H', 'HUEY', 'HUEY UH-1',
  'R66', 'R-66', 'R 66', 'RH66', 'RH-66', '66',
  'B06', 'B206', 'BA206', 'BH206', 'BH-206', 'B-206', 'BA-206', 'BH 206', 'B 206', 'BA 206',
  'B206L', 'BH206L', 'BH-206L', 'B-206L', 'B206 L', 'LONGRANGER', 'LONG RANGER', 'BH206L LONGRANGER',
  'B407',
  'B412',
  'B429',
  'B505',
  'AS50', 'AS350', 'A350', 'EC50', 'H125', 'AS-350', 'AS350B2', 'AS350B3', 'S350B2', 'S350B3', 'H125B3', 'H125B3+', 'H125B2', 'A-STAR', 'AS 350',
  'AS55', 'AS355', 'EC55',
  'EC30', 'EC130', 'H130',
  'EC35', 'EC135', 'H135',
  'EC45', 'EC145', 'H145',
  'AW39', 'AW139', 'A139',
  'A109', 'AW109', 'A109S', 'A109E', 'A109K', 'AW109S', 'AW109E', 'AW109K',
  'A119', 'AW119',
  'K209', 'K-209',
  'S76', 'S-76',
  'S92', 'S-92',
  'H60', 'UH60', 'UH-60', 'S70', 'S-70',
  'MD50', 'MD500', 'H500', 'H-500',
  'MD52', 'MD520',
  'MD60', 'MD600',
  'ALO2', 'SA313', 'SA318', 'ALOUETTE II',
  'ALO3', 'SA316', 'SA319', 'ALOUETTE III',
  'LAMA', 'SA315',
  'PUMA', 'SA330', 'AS332', 'H215', 'EC225', 'H225',
  'CH47', 'CH-47', 'CHINOOK',
  'AH64', 'AH-64', 'APACHE',
  'H160',
  'EH10', 'AW101', 'EH101',
  'MI8', 'MI17', 'MI-8', 'MI-17',
  'KA32',
  'S61', 'S-61',
  'S64', 'S-64',
  'A169', 'AW169',
  'A189', 'AW189',
  'NH90',
  'EC20', 'EC120', 'H120',
  'AS65', 'AS365', 'SA365', 'DAUPHIN', 'H155',
  'BO05', 'BO105', 'BK17', 'BK117',
]);

// Fixed-Wing — Piston
const FW_PISTON_CODES = new Set([
  'A22', 'A-22', 'FOXBAT',
  'C150', 'C152', 'C172', 'C182', 'C206', 'C210', 'C177', 'C170', 'C140',
  'P28A', 'P28R', 'P32R', 'PA18', 'PA34', 'PA44', 'PA28', 'PA32', 'PA38', 'PA46',
  'SR20', 'SR22',
  'DA20', 'DA40', 'DA42', 'DA62',
  'BE36', 'BE58', 'BE35', 'BE33', 'BE55', 'BE76', 'BE23', 'BE19',
  'RV4', 'RV6', 'RV7', 'RV8', 'RV10', 'RV12', 'RV14',
  'MO20', 'M20',
  'AA5', 'AA1',
  'CH7A', '7AC',
  'J3', 'PA11',
  'AN2', 'AN-2',
  'PTS2', 'PITTS',
  'TC06', 'SLING', 'SLING2', 'SLING4',
  'AT01', 'AT-6', 'T6',
  'Z42', 'Z142', 'Z242',
  'S22T', 'SR22T',
  'COL4', 'COL3',
  'SF25', 'RF6',
  'BL8', 'DECATHLON', 'CITABRIA',
  'MC15', 'SAFARI',
  'CH60', 'CH80', 'ZENITH',
  'TRIN', 'TB10', 'TB20', 'TB21',
  'CP10', 'CAP10',
  'HUSK', 'HUSKY',
  'YAK52', 'YK52',
  'SU26', 'SU29', 'SU31',
  'EA30', 'EA330', 'EXTRA',
  'AQUI', 'AQUILA',
  'RALL', 'RALLYE',
  'G2', 'GA8',
  'SAVA', 'SAVANNAH',
  'JABI', 'JABIRU',
  'P2002', 'P92', 'TECNAM',
  'BDOG', 'BULLDOG',
  'CHIP', 'CHIPMUNK', 'DHC1',
]);

// Fixed-Wing — Turbine (turboprop + jet)
const FW_TURBINE_CODES = new Set([
  'C208', 'C208B',
  'PC12', 'PC-12',
  'PC24', 'PC-24',
  'B350', 'BE30', 'BE20', 'BE9L', 'BE99', 'BE10', 'C90', 'E90', 'F90',
  'TBM9', 'TBM8', 'TBM7', 'TBM',
  'DHC6', 'DHC-6',
  'DHC8', 'DH8A', 'DH8B', 'DH8C', 'DH8D',
  'B737', 'B738', 'B38M', 'B739', 'B734', 'B733',
  'A319', 'A320', 'A20N', 'A321', 'A21N', 'A318',
  'B744', 'B748', 'B742', 'B741',
  'B77W', 'B772', 'B773', 'B77L',
  'B789', 'B788', 'B78X',
  'A359', 'A358', 'A35K',
  'E190', 'E195', 'E170', 'E175', 'E290', 'E295',
  'CRJ9', 'CRJ7', 'CRJ2', 'CRJ1',
  'GLF5', 'GLF6', 'GLF4', 'G550', 'G650', 'GLEX',
  'F900', 'FA7X', 'F2TH', 'FA50', 'FA8X',
  'C510', 'C525', 'C56X', 'C680', 'C700', 'C560', 'C550', 'C500',
  'E55P', 'E50P', 'E545', 'E35L',
  'HDJT', 'HA42',
  'LJ45', 'LJ60', 'LJ75', 'LJ35', 'LJ25',
  'CL30', 'CL35', 'CL60', 'GL5T', 'GL7T',
  'AT43', 'AT45', 'AT72', 'AT76', 'ATR',
  'J328', 'JS41', 'JS32',
  'SF34', 'SB20',
  'BA11', 'BAE146', 'B461', 'B462', 'B463', 'RJ85', 'RJ70',
  'DC3', 'DC-3',
  'BE40', 'BE4W',
  'P180', 'PIAGGIO',
  'C130', 'C-130', 'HERC',
  'A400', 'A400M',
  'E2', 'E-2',
]);

const categoryMap = new Map<string, AircraftCategory>();

function addSet(set: Set<string>, cat: AircraftCategory) {
  for (const code of set) {
    categoryMap.set(code.toUpperCase(), cat);
  }
}

addSet(SIMULATOR_CODES, 'simulator');
addSet(HELI_PISTON_CODES, 'heli_piston');
addSet(HELI_TURBINE_CODES, 'heli_turbine');
addSet(FW_PISTON_CODES, 'fw_piston');
addSet(FW_TURBINE_CODES, 'fw_turbine');

/**
 * Classify a normalized aircraft type string into a category.
 */
export function classifyAircraft(normalizedType: string): AircraftCategory {
  const upper = normalizedType.trim().toUpperCase();
  
  // Direct match
  const direct = categoryMap.get(upper);
  if (direct) return direct;

  // Try without hyphens/spaces
  const compact = upper.replace(/[-\s]/g, '');
  const directCompact = categoryMap.get(compact);
  if (directCompact) return directCompact;

  // Partial matching for common prefixes
  for (const [code, cat] of categoryMap) {
    if (upper.startsWith(code) || code.startsWith(upper)) {
      return cat;
    }
  }

  return 'unknown';
}

/**
 * Returns true if the aircraft is a helicopter (piston or turbine).
 */
export function isHelicopter(normalizedType: string): boolean {
  const cat = classifyAircraft(normalizedType);
  return cat === 'heli_piston' || cat === 'heli_turbine';
}

/**
 * Returns true if the aircraft is fixed-wing (piston or turbine).
 */
export function isFixedWing(normalizedType: string): boolean {
  const cat = classifyAircraft(normalizedType);
  return cat === 'fw_piston' || cat === 'fw_turbine';
}

/**
 * Returns true if the aircraft is turbine-powered (heli or FW).
 */
export function isTurbine(normalizedType: string): boolean {
  const cat = classifyAircraft(normalizedType);
  return cat === 'heli_turbine' || cat === 'fw_turbine';
}

/**
 * Returns true if the aircraft is piston-powered (heli or FW).
 */
export function isPiston(normalizedType: string): boolean {
  const cat = classifyAircraft(normalizedType);
  return cat === 'heli_piston' || cat === 'fw_piston';
}
