import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import DashboardAdmin from './pages/DashboardAdmin'
import DashboardSurveyor from './pages/DashboardSurveyor'
import DashboardInstansi from './pages/DashboardInstansi'
import NotFound from './pages/NotFound'

function App() {
  const [count, setCount] = useState(0)

  return (
     <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/surveyor" element={<DashboardSurveyor />} />
        <Route path="/instansi" element={<DashboardInstansi />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
