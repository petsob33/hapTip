import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Login from './pages/Login/Login'
import Zapasy from './pages/Zapasy/Zapasy'
import MojeTipy from './pages/MojeTipy/MojeTipy'
import OstatniTipy from './pages/OstatniTipy/OstatniTipy'
import Extra from './pages/Extra/Extra'
import Zebricek from './pages/Zebricek/Zebricek'
import Tabulka from './pages/Tabulka/Tabulka'
import Profil from './pages/Profil/Profil'
import AdminMatches from './pages/AdminMatches/AdminMatches'
import AdminExtra from './pages/AdminExtra/AdminExtra'
import AdminTeams from './pages/AdminTeams/AdminTeams'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/zapasy" replace />} />
          <Route path="/zapasy" element={<Zapasy />} />
          <Route path="/moje-tipy" element={<MojeTipy />} />
          <Route path="/ostatni-tipy" element={<OstatniTipy />} />
          <Route path="/extra" element={<Extra />} />
          <Route path="/zebricek" element={<Zebricek />} />
          <Route path="/tabulka" element={<Tabulka />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/profil/:playerId" element={<Profil />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin/zapasy" element={<AdminMatches />} />
            <Route path="/admin/extra" element={<AdminExtra />} />
            <Route path="/admin/tymy" element={<AdminTeams />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
