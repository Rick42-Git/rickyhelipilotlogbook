const AIRCRAFT_TYPE_ALIASES: Record<string, string[]> = {
  'RH-22': ['RH22', 'RH 22', 'RH-22'],
  'RH-44': ['RH44', 'RH 44', 'RH-44'],
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
