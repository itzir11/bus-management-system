# NCRTC Bus Management System

A frontend-only capstone project for managing NCRTC's feeder bus network around the Delhi-NCR rapid-rail corridor.

## Tech Stack

- **React 18 + Vite**
- **React Router v6** — client-side routing
- **Leaflet + react-leaflet** — live map (AVLS)
- **Tailwind CSS** — styling
- **JSON seed files** — all data from `src/data/`

## Modules

| Module     | Description                            |
| ---------- | -------------------------------------- |
| AVLS       | Live map of all buses + trip history   |
| Scheduling | Routes, roster grid, driver duties     |
| IMS        | Incident raise, triage, and resolution |
| CMS        | Notices from admin to drivers          |

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Demo Credentials

| Role             | Username    | Password   |
| ---------------- | ----------- | ---------- |
| Admin            | `admin`     | `admin123` |
| Depot Manager    | `manager1`  | `password` |
| Control Operator | `operator1` | `password` |
| Driver           | `driver1`   | `password` |

> These are demo-only credentials seeded in `src/data/users.json`.
