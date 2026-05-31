# Bus Management System

**by Ishika Rohilla**

A frontend-only capstone project built for managing NCRTC's feeder bus network across the Delhi-NCR rapid-rail corridor. Four fully functional modules — live map, scheduling, incident management, and notices — all powered by seeded JSON data with no backend required.

---

## Tech Stack

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Framework | React 18 + Vite                         |
| Routing   | React Router v6                         |
| Styling   | Tailwind CSS + CSS Modules              |
| Maps      | Leaflet + react-leaflet (OpenStreetMap) |
| State     | React Context + localStorage            |
| Data      | Static JSON seed files (`src/data/`)    |

---

## Modules

| Module               | Description                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AVLS**             | Live map with vehicle markers updating every 6s via a tick simulator, depot filter, side panel with driver/route info, and full trip history view |
| **Scheduling**       | Route management with stop sequences, weekly roster grid, duty assignment and publish workflow                                                    |
| **IMS**              | Incident raise form with severity tiles, filterable incident list, detail view with status timeline, and driver panic button                      |
| **CMS**              | Admin notice board with read receipts and audience targeting; driver notice reader with read tracking                                             |
| **Driver Dashboard** | Mobile-first view showing today's duty, unread notices, and one-tap P1 panic button                                                               |

---

## Roles

| Role               | Access                                            |
| ------------------ | ------------------------------------------------- |
| `admin`            | Full access — all modules, all depots             |
| `control_operator` | Dashboard, AVLS, IMS                              |
| `depot_manager`    | Dashboard, AVLS, Scheduling, IMS (own depot only) |
| `driver`           | Duty view, Notices, Incidents (mobile-first)      |

---

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

> All data is pre-seeded — no database or backend needed.

---

## Demo Credentials

| Role             | Username    | Password   |
| ---------------- | ----------- | ---------- |
| Admin            | `admin`     | `admin123` |
| Depot Manager    | `manager1`  | `password` |
| Control Operator | `operator1` | `password` |
| Driver           | `driver1`   | `password` |

> Demo-only credentials. Seeded in `src/data/users.json`.

---

## Project Structure

```
src/
  data/           ← 12 JSON seed files (depots, vehicles, users, duties, pings…)
  styles/         ← globals.css with CSS custom property design tokens
  components/     ← Layout, Navbar, Sidebar, StatCard, ProtectedRoute
  context/        ← AuthContext, DataContext
  utils/          ← tickSimulator, helpers
  pages/
    Login/
    Dashboard/
    AVLS/         ← AVLSPage (live map), HistoryPage (trip replay)
    Scheduling/   ← SchedulingPage, RoutesPage, RosterPage
    IMS/          ← IMSPage, IncidentDetail, RaiseIncident
    CMS/          ← CMSPage (admin + driver views)
    Driver/       ← DriverDashboard
```

---

## Seeded Data

- 4 depots across NCR (Noida Sec-37, Anand Vihar, Ghaziabad, Sahibabad)
- 20 vehicles (5 per depot, UP-format reg numbers)
- 25 users across all 4 roles
- 5 routes with real NCR stop coordinates
- 30 duties covering yesterday / today / tomorrow
- 75 GPS pings across 5 vehicles for live map simulation
- 10 incidents in various states, 5 notices with read receipts
