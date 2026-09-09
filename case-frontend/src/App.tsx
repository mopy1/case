import { Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { ProjectsDashboardPage } from "@/features/projects/pages/ProjectsDashboardPage"
import { ProjectTasksPage } from "@/features/tasks/pages/ProjectTasksPage"
import { ProjectNotesPage } from "@/features/notes/pages/ProjectNotesPage"
import { ProjectXmiPage } from "@/features/xmi/pages/ProjectXmiPage"
import { ProjectGeneratorPage } from "@/features/generator/pages/ProjectGeneratorPage"
import { ProjectLayout } from "@/layouts/ProjectLayout"
import { Home } from "@/pages/Home"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/proyectos" element={<ProjectsDashboardPage />} />
        <Route path="/proyectos/:id" element={<ProjectLayout />}>
          <Route index element={<Navigate to="tareas" replace />} />
          <Route path="tareas" element={<ProjectTasksPage />} />
          <Route path="notas" element={<ProjectNotesPage />} />
          <Route path="xmi" element={<ProjectXmiPage />} />
          <Route path="generador" element={<ProjectGeneratorPage />} />
        </Route>
      </Routes>
    </TooltipProvider>
  )
}

export default App
