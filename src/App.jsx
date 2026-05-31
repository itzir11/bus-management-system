import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'

import AVLSPage from './pages/AVLS/AVLSPage'
import HistoryPage from './pages/AVLS/HistoryPage'

import SchedulingPage from './pages/Scheduling/SchedulingPage'
import RoutesPage from './pages/Scheduling/RoutesPage'
import RosterPage from './pages/Scheduling/RosterPage'

import IMSPage from './pages/IMS/IMSPage'
import IncidentDetail from './pages/IMS/IncidentDetail'
import RaiseIncident from './pages/IMS/RaiseIncident'

import CMSPage from './pages/CMS/CMSPage'

import DriverDashboard from './pages/Driver/DriverDashboard'

const ALL_ROLES = ['admin', 'control_operator', 'depot_manager', 'driver']
const STAFF_ROLES = ['admin', 'control_operator', 'depot_manager']
const ADMIN_MANAGER = ['admin', 'depot_manager']

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
              <Route element={<Layout />}>

                <Route path="/" element={
                  <ProtectedRoute allowedRoles={STAFF_ROLES} driverRedirect="/driver" />
                }>
                  <Route index element={<Dashboard />} />
                </Route>

                <Route path="/avls" element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
                  <Route index element={<AVLSPage />} />
                  <Route path="history" element={<HistoryPage />} />
                </Route>

                <Route path="/scheduling" element={<ProtectedRoute allowedRoles={ADMIN_MANAGER} />}>
                  <Route index element={<SchedulingPage />} />
                  <Route path="routes" element={<RoutesPage />} />
                  <Route path="roster" element={<RosterPage />} />
                </Route>

                <Route path="/ims" element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
                  <Route index element={<IMSPage />} />
                  <Route path="raise" element={<RaiseIncident />} />
                  <Route path=":id" element={<IncidentDetail />} />
                </Route>

                <Route path="/cms" element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
                  <Route index element={<CMSPage />} />
                </Route>

                <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']} />}>
                  <Route index element={<DriverDashboard />} />
                </Route>

              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
