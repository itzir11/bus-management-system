import { createContext, useContext, useState, useEffect } from "react";
import depotsJson from "../data/depots.json";
import stopsJson from "../data/stops.json";
import routesJson from "../data/routes.json";
import routeStopsJson from "../data/route_stops.json";
import vehiclesJson from "../data/vehicles.json";
import usersJson from "../data/users.json";
import dutiesJson from "../data/duties.json";
import incidentsJson from "../data/incidents.json";
import incidentEventsJson from "../data/incident_events.json";
import noticesJson from "../data/notices.json";
import noticeReadsJson from "../data/notice_reads.json";
import gpsPingsJson from "../data/gps_pings.json";

const DataContext = createContext(null);
const STORAGE_KEY = "bms_data";

function loadMutableState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return {
    duties: dutiesJson,
    incidents: incidentsJson,
    incidentEvents: incidentEventsJson,
    notices: noticesJson,
    noticeReads: noticeReadsJson,
  };
}

export function DataProvider({ children }) {
  const [mutable, setMutable] = useState(loadMutableState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mutable));
  }, [mutable]);

  function updateDuty(updatedDuty) {
    setMutable((prev) => ({
      ...prev,
      duties: prev.duties.map((d) =>
        d.id === updatedDuty.id ? updatedDuty : d,
      ),
    }));
  }

  function addIncident(incident) {
    setMutable((prev) => ({
      ...prev,
      incidents: [...prev.incidents, incident],
    }));
  }

  function addIncidentEvent(event) {
    setMutable((prev) => ({
      ...prev,
      incidentEvents: [...prev.incidentEvents, event],
    }));
  }

  function updateIncident(updatedIncident) {
    setMutable((prev) => ({
      ...prev,
      incidents: prev.incidents.map((i) =>
        i.id === updatedIncident.id ? updatedIncident : i,
      ),
    }));
  }

  function addNotice(notice) {
    setMutable((prev) => ({
      ...prev,
      notices: [...prev.notices, notice],
    }));
  }

  function markNoticeRead(noticeId, userId) {
    const alreadyRead = mutable.noticeReads.some(
      (r) => r.notice_id === noticeId && r.user_id === userId,
    );
    if (alreadyRead) return;
    const newRead = {
      id: `NR${Date.now()}`,
      notice_id: noticeId,
      user_id: userId,
      read_at: new Date().toISOString(),
    };
    setMutable((prev) => ({
      ...prev,
      noticeReads: [...prev.noticeReads, newRead],
    }));
  }

  const value = {
    depots: depotsJson,
    stops: stopsJson,
    routes: routesJson,
    routeStops: routeStopsJson,
    vehicles: vehiclesJson,
    users: usersJson,
    gpsPings: gpsPingsJson,
    duties: mutable.duties,
    incidents: mutable.incidents,
    incidentEvents: mutable.incidentEvents,
    notices: mutable.notices,
    noticeReads: mutable.noticeReads,
    updateDuty,
    addIncident,
    addIncidentEvent,
    updateIncident,
    addNotice,
    markNoticeRead,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  return useContext(DataContext);
}

export { DataContext };
