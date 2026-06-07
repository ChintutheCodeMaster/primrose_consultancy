import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Sparkles, MapPin } from 'lucide-react';

// Public US TopoJSON (states) — hosted by react-simple-maps maintainers
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// Approx centroids for top states we care about (lat, lon)
const STATE_CENTROIDS: Record<string, [number, number]> = {
  CA: [-119.4, 37.0], NY: [-75.5, 42.9], MA: [-71.8, 42.3], CT: [-72.7, 41.6],
  NJ: [-74.4, 40.1], PA: [-77.2, 40.9], TX: [-99.0, 31.5], FL: [-81.7, 28.0],
  IL: [-89.0, 40.0], MI: [-84.6, 44.3], OH: [-82.7, 40.4], NC: [-79.4, 35.5],
  GA: [-83.4, 32.8], VA: [-78.5, 37.9], MD: [-76.7, 39.0], WA: [-120.4, 47.4],
  CO: [-105.5, 39.0], IN: [-86.3, 40.0], TN: [-86.7, 35.9], MO: [-92.4, 38.6],
  RI: [-71.5, 41.7], NH: [-71.6, 43.7], ME: [-69.4, 45.4], MN: [-94.6, 46.3],
  WI: [-89.6, 44.5], AZ: [-111.7, 34.3], OR: [-120.6, 43.9], LA: [-92.0, 31.0],
  DC: [-77.0, 38.9],
};

interface Acceptance { university: string; state: string | null; cohort: string }

interface Props {
  acceptances: Acceptance[];
  cohorts: string[];
}

const DEMO: Acceptance[] = [
  { university: 'Harvard University', state: 'MA', cohort: '2024' },
  { university: 'MIT', state: 'MA', cohort: '2025' },
  { university: 'Yale University', state: 'CT', cohort: '2024' },
  { university: 'Stanford University', state: 'CA', cohort: '2025' },
  { university: 'UC Berkeley', state: 'CA', cohort: '2024' },
  { university: 'UCLA', state: 'CA', cohort: '2025' },
  { university: 'Princeton University', state: 'NJ', cohort: '2024' },
  { university: 'Columbia University', state: 'NY', cohort: '2025' },
  { university: 'NYU', state: 'NY', cohort: '2024' },
  { university: 'Cornell University', state: 'NY', cohort: '2025' },
  { university: 'University of Pennsylvania', state: 'PA', cohort: '2024' },
  { university: 'Carnegie Mellon University', state: 'PA', cohort: '2025' },
  { university: 'Brown University', state: 'RI', cohort: '2024' },
  { university: 'Dartmouth College', state: 'NH', cohort: '2025' },
  { university: 'University of Chicago', state: 'IL', cohort: '2024' },
  { university: 'Northwestern University', state: 'IL', cohort: '2025' },
  { university: 'Duke University', state: 'NC', cohort: '2024' },
  { university: 'UNC Chapel Hill', state: 'NC', cohort: '2025' },
  { university: 'Georgia Tech', state: 'GA', cohort: '2024' },
  { university: 'Emory University', state: 'GA', cohort: '2025' },
  { university: 'University of Michigan', state: 'MI', cohort: '2024' },
  { university: 'UT Austin', state: 'TX', cohort: '2025' },
  { university: 'Rice University', state: 'TX', cohort: '2024' },
  { university: 'Vanderbilt University', state: 'TN', cohort: '2025' },
  { university: 'Johns Hopkins University', state: 'MD', cohort: '2024' },
  { university: 'Georgetown University', state: 'DC', cohort: '2025' },
  { university: 'University of Washington', state: 'WA', cohort: '2024' },
];

export function AcceptanceMap({ acceptances, cohorts }: Props) {
  const isDemo = acceptances.length === 0;
  const data = isDemo ? DEMO : acceptances;

  const [hoverState, setHoverState] = useState<string | null>(null);

  const byState = useMemo(() => {
    const m = new Map<string, { count: number; unis: Map<string, number> }>();
    for (const a of data) {
      if (!a.state) continue;
      const key = a.state.toUpperCase();
      if (!m.has(key)) m.set(key, { count: 0, unis: new Map() });
      const e = m.get(key)!;
      e.count += 1;
      e.unis.set(a.university, (e.unis.get(a.university) ?? 0) + 1);
    }
    return m;
  }, [data]);

  const maxCount = Math.max(1, ...Array.from(byState.values()).map((v) => v.count));
  const totalStates = byState.size;
  const totalAcceptances = data.length;

  // FIPS -> state code mapping (we color by FIPS from geography props)
  const FIPS_TO_CODE: Record<string, string> = {
    '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL',
    '13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
    '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH',
    '34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
    '45':'SC','46':'TN','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY',
  };

  const hovered = hoverState ? byState.get(hoverState) : null;

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 shadow-sm">
      {isDemo && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
            <Sparkles className="h-3.5 w-3.5" />
            Sample map — your real acceptances will plot here as students get in.
          </div>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Demo</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        {/* Map */}
        <div className="relative">
          <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1000 }} width={780} height={460} style={{ width: '100%', height: 'auto' }}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = String(geo.id).padStart(2, '0');
                  const code = FIPS_TO_CODE[fips];
                  const entry = code ? byState.get(code) : undefined;
                  const intensity = entry ? 0.25 + (entry.count / maxCount) * 0.7 : 0;
                  const fill = entry
                    ? `hsl(160 70% ${72 - intensity * 32}%)`
                    : 'hsl(210 16% 93%)';
                  const isHover = code && hoverState === code;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => code && entry && setHoverState(code)}
                      onMouseLeave={() => setHoverState(null)}
                      style={{
                        default: {
                          fill,
                          stroke: '#ffffff',
                          strokeWidth: 0.75,
                          outline: 'none',
                          transition: 'fill 200ms',
                        },
                        hover: {
                          fill: entry ? 'hsl(160 75% 42%)' : 'hsl(210 16% 88%)',
                          stroke: '#ffffff',
                          strokeWidth: 1,
                          outline: 'none',
                          cursor: entry ? 'pointer' : 'default',
                        },
                        pressed: { fill, outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Acceptance markers */}
            {Array.from(byState.entries()).map(([code, entry]) => {
              const coords = STATE_CENTROIDS[code];
              if (!coords) return null;
              const r = 6 + Math.min(18, (entry.count / maxCount) * 18);
              return (
                <Marker key={code} coordinates={coords}>
                  <circle r={r} fill="hsl(160 80% 38%)" fillOpacity={0.22} />
                  <circle r={r * 0.55} fill="hsl(160 85% 32%)" fillOpacity={0.85} />
                  <text
                    textAnchor="middle"
                    y={3}
                    style={{ fontFamily: 'inherit', fontSize: 10, fontWeight: 700, fill: 'white', pointerEvents: 'none' }}
                  >
                    {entry.count}
                  </text>
                </Marker>
              );
            })}
          </ComposableMap>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Acceptances</span>
              <div className="flex h-3 w-32 overflow-hidden rounded-full" style={{ background: 'linear-gradient(to right, hsl(160 70% 88%), hsl(160 75% 42%))' }} />
              <span className="text-[11px]">low → high</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-700" />
              <span>Marker size = volume in state</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Reach</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-3xl font-bold tabular-nums">{totalStates}</div>
              <div className="text-sm text-muted-foreground">states</div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {totalAcceptances} acceptances across {cohorts.length || '—'} cohort{cohorts.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {hovered ? `Spotlight · ${hoverState}` : 'Hover a state'}
            </div>
            {hovered ? (
              <div className="mt-2 space-y-1.5">
                <div className="text-2xl font-bold tabular-nums text-emerald-700">{hovered.count}</div>
                <ul className="space-y-1 text-xs text-foreground/90">
                  {Array.from(hovered.unis.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([u, c]) => (
                      <li key={u} className="flex items-center justify-between gap-2">
                        <span className="truncate">{u}</span>
                        <span className="font-semibold text-muted-foreground">{c}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <div className="mt-2 text-xs text-muted-foreground">
                Move your cursor over the map to see which universities accepted students in each state.
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Top states</div>
            <ul className="mt-2 space-y-1.5 text-xs">
              {Array.from(byState.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 6)
                .map(([code, e]) => (
                  <li key={code} className="flex items-center gap-2">
                    <span className="w-7 font-semibold text-foreground">{code}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600"
                        style={{ width: `${(e.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-semibold tabular-nums text-foreground">{e.count}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
