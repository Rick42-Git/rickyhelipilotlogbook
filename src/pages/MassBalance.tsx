import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportMassBalancePDF } from '@/lib/exportMassBalance';
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

  const handleExportPDF = () => {
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
            {aircraftTypes.map(a => (
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
                  <svg viewBox="0 0 24 24" className={`w-8 h-8 transition-colors ${selectedAircraft.name === a.name ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2C12 2 10 6 10 8V11L4 14V16L10 14.5V18L8 19.5V21L12 20L16 21V19.5L14 18V14.5L20 16V14L14 11V8C14 6 12 2 12 2Z" />
                  </svg>
                  <div>
                    <p className="font-mono text-[9px] md:text-[10px] text-foreground font-semibold leading-tight">
                      {a.name}
                    </p>
                    <p className="font-mono text-[8px] text-muted-foreground mt-0.5">
                      {a.maxGrossWeight.toLocaleString()} lbs
                    </p>
                  </div>
                </div>
                {selectedAircraft.name === a.name && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            ))}
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
