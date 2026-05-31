import { useState, useEffect, useRef } from "react";

export function useTickSimulator(vehicles, gpsPings, isRunning) {
  const pingsByVehicle = useRef({});
  const cursors = useRef({});

  useEffect(() => {
    const grouped = {};
    for (const ping of gpsPings) {
      if (!grouped[ping.vehicle_id]) grouped[ping.vehicle_id] = [];
      grouped[ping.vehicle_id].push(ping);
    }
    for (const vid of Object.keys(grouped)) {
      grouped[vid].sort((a, b) => new Date(a.ts) - new Date(b.ts));
    }
    pingsByVehicle.current = grouped;

    const initial = {};
    for (const v of vehicles) {
      const pings = grouped[v.id];
      if (pings && pings.length > 0) {
        const last = pings[pings.length - 1];
        initial[v.id] = {
          lat: last.lat,
          lng: last.lng,
          speed_kmh: last.speed_kmh,
          ts: last.ts,
        };
        cursors.current[v.id] = 0;
      }
    }
    setLivePositions(initial);
  }, [vehicles, gpsPings]);

  const [livePositions, setLivePositions] = useState(() => {
    const initial = {};
    for (const v of vehicles) {
      const pings = gpsPings.filter((p) => p.vehicle_id === v.id);
      if (pings.length > 0) {
        const sorted = [...pings].sort(
          (a, b) => new Date(a.ts) - new Date(b.ts),
        );
        const last = sorted[sorted.length - 1];
        initial[v.id] = {
          lat: last.lat,
          lng: last.lng,
          speed_kmh: last.speed_kmh,
          ts: last.ts,
        };
      }
    }
    return initial;
  });

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setLivePositions((prev) => {
        const next = { ...prev };
        for (const v of vehicles) {
          const pings = pingsByVehicle.current[v.id];
          if (!pings || pings.length === 0) continue;
          const cursor = cursors.current[v.id] ?? 0;
          const ping = pings[cursor];
          next[v.id] = {
            lat: ping.lat,
            lng: ping.lng,
            speed_kmh: ping.speed_kmh,
            ts: ping.ts,
          };
          cursors.current[v.id] = (cursor + 1) % pings.length;
        }
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isRunning, vehicles]);

  return livePositions;
}
