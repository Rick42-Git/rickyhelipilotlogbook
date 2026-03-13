import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportMassBalancePDF } from '@/lib/exportMassBalance';
import { SignatureDialog } from '@/components/mass-balance/SignatureDialog';
import { aircraftTypes, AircraftType } from '@/data/aircraftData';
import { LoadingSheet } from '@/components/mass-balance/LoadingSheet';
import { CGEnvelopeChart } from '@/components/mass-balance/CGEnvelopeChart';
import { ResultsPanel } from '@/components/mass-balance/ResultsPanel';
import { FuelBurnPlanning } from '@/components/mass-balance/FuelBurnPlanning';
import { LoadingDiagram } from '@/components/mass-balance/LoadingDiagram';
import { LateralCGChart } from '@/components/mass-balance/LateralCGChart';
import { AircraftDataPanel } from '@/components/mass-balance/AircraftDataPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import helicopterIcon from '@/assets/helicopter-icon.png';

function isPointInPolygon(px: number, py: number, polygon: { station: number; weight: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].station, yi = polygon[i].weight;
    const xj = polygon[j].station, yj = polygon[j].weight;
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const MassBalance = () => {
  const navigate = useNavigate();
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftType>(aircraftTypes[0]);
  const [weights, setWeights] = useState<number[]>(aircraftTypes[0].stations.map(s => s.defaultWeight));

  const handleAircraftChange = useCallback((aircraft: AircraftType) => {
    setSelectedAircraft(aircraft);
    setWeights(aircraft.stations.map(s => s.defaultWeight));
  }, []);

  const handleWeightChange = useCallback((index: number, value: number) => {
    setWeights(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const { totalWeight, totalMoment, cgStation, lateralCG, lateralMoment, weightMargin, withinLimits, lateralWithinLimits } = useMemo(() => {
    let tw = 0, tm = 0, latMoment = 0;
    selectedAircraft.stations.forEach((s, i) => {
      tw += weights[i];
      tm += weights[i] * s.station;
      latMoment += weights[i] * s.buttline;
    });
    const cg = tw > 0 ? tm / tw : 0;
    const latCG = tw > 0 ? latMoment / tw : 0;
    const margin = selectedAircraft.maxGrossWeight - tw;
    const longInLimits = tw <= selectedAircraft.maxGrossWeight && isPointInPolygon(cg, tw, selectedAircraft.cgEnvelope);
    const latInLimits = Math.abs(latCG) <= selectedAircraft.lateralCGLimit;
    return {
      totalWeight: tw,
      totalMoment: tm,
      cgStation: cg,
      lateralCG: latCG,
      lateralMoment: latMoment,
      weightMargin: margin,
      withinLimits: longInLimits && latInLimits,
      lateralWithinLimits: latInLimits,
    };
  }, [weights, selectedAircraft]);

  const fuelStationIndex = useMemo(() => {
    return selectedAircraft.stations.findIndex(s => s.label.toLowerCase().includes('fuel'));
  }, [selectedAircraft]);

  const [signatureOpen, setSignatureOpen] = useState(false);

  const handleExportPDF = (signature?: { imageDataUrl: string; name: string; title: string }) => {
    exportMassBalancePDF({
      aircraft: selectedAircraft,
      weights,
      totalWeight,
      totalMoment,
      cgStation,
      lateralCG,
      lateralMoment,
      weightMargin,
      withinLimits,
      lateralWithinLimits,
      signature,
    });
  };

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="glass-panel hud-border p-3 md:p-4 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--primary)) 10px, hsl(var(--primary)) 11px)',
          }} />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={helicopterIcon} alt="Helicopter" className="h-8 md:h-10 w-auto opacity-80 drop-shadow-[0_0_8px_hsl(38_95%_55%/0.3)]" />
              <div>
                <h1 className="font-mono text-base md:text-xl font-bold text-primary tracking-wider">
                  MASS & BALANCE <span className="text-[10px] md:text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded ml-1">CALCULATOR</span>
                </h1>
                <p className="font-mono text-[9px] md:text-xs text-muted-foreground tracking-widest">ROTARY WING AIRCRAFT LOADING COMPUTER</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="font-mono text-[10px] md:text-xs h-8 md:h-9 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              EXPORT PDF
            </Button>
          </div>
        </div>

        {/* Aircraft Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-accent" />
            <h2 className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Select Aircraft Type</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {aircraftTypes.map(a => {
              const isTwin = ['Bell 429', 'Airbus H135 (EC135)', 'Airbus H145 (EC145)', 'Kawasaki BK117'].includes(a.name);
              const isLight = ['Robinson R22 Beta II', 'Robinson R44 Raven II'].includes(a.name);
              const isHeavy = ['Bell UH-1H Huey'].includes(a.name);
              let categoryLabel = 'TURBINE SINGLE';
              if (isTwin) categoryLabel = 'TWIN ENGINE';
              else if (isLight) categoryLabel = 'PISTON';
              else if (isHeavy) categoryLabel = 'TURBINE HEAVY';

              return (
              <button
                key={a.name}
                onClick={() => handleAircraftChange(a)}
                className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-200 p-3 text-center ${
                  selectedAircraft.name === a.name
                    ? 'border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] bg-primary/10'
                    : 'border-border/50 hover:border-primary/50 bg-card/50 hover:bg-card'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg viewBox="0 0 48 48" className={`w-10 h-10 transition-colors ${selectedAircraft.name === a.name ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {isTwin ? (
                      /* Twin-engine: wider body, two engine bumps on top */
                      <>
                        {/* Fuselage */}
                        <path d="M14 28C10 27 6 26 4 25L6 23L14 24" />
                        <path d="M14 22C14 18 18 14 24 12C30 14 34 18 34 22V28C34 32 30 36 24 38C18 36 14 32 14 28V22Z" />
                        <path d="M34 28C38 27 42 26 44 25L42 23L34 24" />
                        {/* Twin engines */}
                        <circle cx="19" cy="16" r="2.5" strokeWidth="1.2" />
                        <circle cx="29" cy="16" r="2.5" strokeWidth="1.2" />
                        {/* Rotor mast */}
                        <line x1="24" y1="12" x2="24" y2="6" />
                        <line x1="14" y1="6" x2="34" y2="6" strokeWidth="1" />
                        {/* Skids */}
                        <line x1="17" y1="38" x2="17" y2="42" />
                        <line x1="31" y1="38" x2="31" y2="42" />
                        <line x1="14" y1="42" x2="20" y2="42" />
                        <line x1="28" y1="42" x2="34" y2="42" />
                        {/* Windshield */}
                        <path d="M20 22L24 20L28 22" strokeWidth="1" />
                      </>
                    ) : isLight ? (
                      /* Light piston: small, simple bubble shape */
                      <>
                        {/* Small bubble fuselage */}
                        <ellipse cx="24" cy="26" rx="8" ry="9" />
                        {/* Tail boom */}
                        <line x1="24" y1="17" x2="24" y2="8" />
                        <path d="M20 8L28 8" strokeWidth="1" />
                        {/* Small tail rotor */}
                        <line x1="24" y1="8" x2="22" y2="6" strokeWidth="1" />
                        <line x1="24" y1="8" x2="26" y2="10" strokeWidth="1" />
                        {/* Main rotor */}
                        <line x1="12" y1="17" x2="36" y2="17" strokeWidth="1" />
                        {/* Skids */}
                        <line x1="19" y1="35" x2="19" y2="40" />
                        <line x1="29" y1="35" x2="29" y2="40" />
                        <line x1="16" y1="40" x2="22" y2="40" />
                        <line x1="26" y1="40" x2="32" y2="40" />
                        {/* Windshield */}
                        <path d="M20 24L24 21L28 24" strokeWidth="1" />
                      </>
                    ) : isHeavy ? (
                      /* Heavy/utility: large, boxy UH-1 style */
                      <>
                        {/* Large boxy fuselage */}
                        <path d="M12 20L14 16L34 16L36 20V30L34 34H14L12 30V20Z" />
                        {/* Tail boom */}
                        <line x1="24" y1="16" x2="24" y2="6" strokeWidth="1.5" />
                        <path d="M20 6L28 6" />
                        {/* Tail rotor */}
                        <line x1="24" y1="6" x2="21" y2="3" strokeWidth="1.2" />
                        <line x1="24" y1="6" x2="27" y2="9" strokeWidth="1.2" />
                        {/* Main rotor */}
                        <line x1="8" y1="16" x2="40" y2="16" strokeWidth="1.2" />
                        {/* Skids */}
                        <line x1="15" y1="34" x2="15" y2="40" />
                        <line x1="33" y1="34" x2="33" y2="40" />
                        <line x1="12" y1="40" x2="18" y2="40" strokeWidth="1.5" />
                        <line x1="30" y1="40" x2="36" y2="40" strokeWidth="1.5" />
                        {/* Cargo door */}
                        <line x1="30" y1="20" x2="30" y2="30" strokeWidth="1" strokeDasharray="2,2" />
                        {/* Windshield */}
                        <path d="M16 20L24 17L32 20" strokeWidth="1" />
                      </>
                    ) : (
                      /* Standard turbine single */
                      <>
                        {/* Fuselage */}
                        <path d="M16 22C16 18 19 15 24 13C29 15 32 18 32 22V28C32 32 29 35 24 37C19 35 16 32 16 28V22Z" />
                        {/* Tail boom */}
                        <line x1="24" y1="13" x2="24" y2="6" />
                        <path d="M20 6L28 6" strokeWidth="1" />
                        {/* Tail rotor */}
                        <line x1="24" y1="6" x2="22" y2="4" strokeWidth="1" />
                        <line x1="24" y1="6" x2="26" y2="8" strokeWidth="1" />
                        {/* Engine */}
                        <ellipse cx="24" cy="16" rx="3" ry="2" strokeWidth="1" />
                        {/* Main rotor */}
                        <line x1="12" y1="13" x2="36" y2="13" strokeWidth="1" />
                        {/* Skids */}
                        <line x1="18" y1="37" x2="18" y2="42" />
                        <line x1="30" y1="37" x2="30" y2="42" />
                        <line x1="15" y1="42" x2="21" y2="42" />
                        <line x1="27" y1="42" x2="33" y2="42" />
                        {/* Windshield */}
                        <path d="M20 22L24 19L28 22" strokeWidth="1" />
                      </>
                    )}
                  </svg>
                  <div>
                    <p className="font-mono text-[9px] md:text-[10px] text-foreground font-semibold leading-tight">
                      {a.name}
                    </p>
                    <p className="font-mono text-[8px] text-muted-foreground mt-0.5">
                      {a.maxGrossWeight.toLocaleString()} lbs
                    </p>
                    <p className={`font-mono text-[7px] mt-0.5 tracking-wider ${
                      isTwin ? 'text-accent' : isHeavy ? 'text-destructive' : isLight ? 'text-success' : 'text-primary'
                    }`}>
                      {categoryLabel}
                    </p>
                  </div>
                </div>
                {selectedAircraft.name === a.name && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <LoadingSheet
              stations={selectedAircraft.stations}
              weights={weights}
              onWeightChange={handleWeightChange}
              totalWeight={totalWeight}
              totalMoment={totalMoment}
              lateralMoment={lateralMoment}
              maxGrossWeight={selectedAircraft.maxGrossWeight}
            />
            <FuelBurnPlanning
              currentWeights={weights}
              stations={selectedAircraft.stations}
              fuelStationIndex={fuelStationIndex}
              fuelWeightPerUnit={selectedAircraft.fuelWeightPerUnit || 6}
              maxGrossWeight={selectedAircraft.maxGrossWeight}
              cgEnvelope={selectedAircraft.cgEnvelope}
              lateralCGLimit={selectedAircraft.lateralCGLimit}
              isPointInPolygon={isPointInPolygon}
            />
          </div>
          <div className="space-y-6">
            <ResultsPanel
              withinLimits={withinLimits}
              cgStation={cgStation}
              lateralCG={lateralCG}
              lateralWithinLimits={lateralWithinLimits}
              lateralCGLimit={selectedAircraft.lateralCGLimit}
              weightMargin={weightMargin}
              grossWeight={totalWeight}
              maxGrossWeight={selectedAircraft.maxGrossWeight}
              totalMoment={totalMoment}
            />
            <CGEnvelopeChart
              envelope={selectedAircraft.cgEnvelope}
              currentStation={cgStation}
              currentWeight={totalWeight}
              withinLimits={withinLimits}
            />
            <LateralCGChart
              lateralCG={lateralCG}
              lateralCGLimit={selectedAircraft.lateralCGLimit}
              stations={selectedAircraft.stations}
              weights={weights}
            />
            <LoadingDiagram
              stations={selectedAircraft.stations}
              weights={weights}
            />
            <AircraftDataPanel aircraft={selectedAircraft} currentEmptyWeight={weights[0]} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-mono text-[10px] text-muted-foreground/50 tracking-widest">
            ROTARY WING M&B COMPUTER
          </p>
          <p className="font-mono text-[9px] text-muted-foreground/30 mt-1">
            For reference only — verify with official documentation
          </p>
        </div>
      </div>
    </div>
  );
};

export default MassBalance;
