const AIRCRAFT_TYPE_ALIASES: Record<string, string[]> = {
  'RH-22': ['RH22', 'RH 22', 'RH-22', 'R22', 'R-22', 'R 22'],
  'RH-44': ['RH44', 'RH 44', 'RH-44', 'R44', 'R-44', 'R 44'],
  'FNTP II': ['FNTP II', 'FNTP-II', 'FNTP 2', 'FNTPII', 'FNTP2', 'FSTD I', 'FSTD-I', 'FSTD 1', 'FSTDI', 'FSTD1', 'FSTD II', 'FSTD-II', 'FSTD 2', 'FSTDII', 'FSTD2'],
  'SA341': ['GAZ', 'GAZELLE', 'SA341', 'SA342', 'SA 341', 'SA 342', 'SA-341', 'SA-342'],
  'BH206': ['BA206', 'BA 206', 'BH206', 'B206', 'BH 206', 'B 206', 'BA-206', 'BH-206', 'B-206'],
  'Huey UH-1': ['UH-1H', 'UH-1', 'UH1', 'HUEY', 'UH 1H', 'UH 1', 'HUEY UH-1', 'UH1H'],
  'BH206L LongRanger': ['BH206L', 'B206L', 'B206 L', 'LONG RANGER', 'LONGRANGER', 'BH 206L', 'B-206L', 'BH-206L', 'BH206L LONGRANGER'],
};

const aliasMap = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(AIRCRAFT_TYPE_ALIASES)) {
  for (const alias of aliases) {
    aliasMap.set(alias.toUpperCase(), canonical);
  }
}

export function normalizeAircraftType(raw: string): string {
  const upper = raw.trim().toUpperCase();
  return aliasMap.get(upper) ?? raw.trim();
}
