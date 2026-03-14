const AIRCRAFT_TYPE_ALIASES: Record<string, string[]> = {
  'RH-22': ['RH22', 'RH 22', 'RH-22', 'R22', 'R-22', 'R 22'],
  'RH-44': ['RH44', 'RH 44', 'RH-44', 'R44', 'R-44', 'R 44'],
  'FNTP II': ['FNTP II', 'FNTP-II', 'FNTP 2', 'FNTPII', 'FNTP2', 'FSTD I', 'FSTD-I', 'FSTD 1', 'FSTDI', 'FSTD1', 'FSTD II', 'FSTD-II', 'FSTD 2', 'FSTDII', 'FSTD2'],
  'Gazelle': ['GAZ', 'GAZELLE'],
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
