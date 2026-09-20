import { Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { ProjectsDashboardPage } from "@/features/projects/pages/ProjectsDashboardPage"
import { DiagramEditorPage } from "@/features/diagram/pages/DiagramEditorPage"
import { ProjectTasksPage } from "@/features/tasks/pages/ProjectTasksPage"
import { ProjectNotesPage } from "@/features/notes/pages/ProjectNotesPage"
import { ProjectXmiPage } from "@/features/xmi/pages/ProjectXmiPage"
import { ProjectGeneratorPage } from "@/features/generator/pages/ProjectGeneratorPage"
import { ProjectLayout } from "@/layouts/ProjectLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { GuestRoute } from "@/routes/GuestRoute"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  const isAuthenticated = Boolean(localStorage.getItem("token"))

  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/proyectos" : "/login"} replace />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/proyectos" element={<ProjectsDashboardPage />} />
          <Route path="/proyectos/:id" element={<ProjectLayout />}>
            <Route index element={<Navigate to="diagrama" replace />} />
            <Route path="diagrama" element={<DiagramEditorPage />} />
            <Route path="tareas" element={<ProjectTasksPage />} />
            <Route path="notas" element={<ProjectNotesPage />} />
            <Route path="xmi" element={<ProjectXmiPage />} />
            <Route path="generador" element={<ProjectGeneratorPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/proyectos" : "/login"} replace />} />
      </Routes>
    </TooltipProvider>
  )
}

export default App
