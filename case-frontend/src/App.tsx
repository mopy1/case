import { Route, Routes } from "react-router-dom"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { Home } from "@/pages/Home"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
