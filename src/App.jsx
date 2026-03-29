import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import VerificarEmail from './pages/VerificarEmail'
import Home from './pages/Home'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/verificar-email" element={<VerificarEmail />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  )
}

export default App
