import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { ProjectLayout } from "@/layouts/ProjectLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { GuestRoute } from "@/routes/GuestRoute"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import { useTheme } from "@/contexts/ThemeContext"

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })))
const ProjectsDashboardPage = lazy(() =>
  import("@/features/projects/pages/ProjectsDashboardPage").then((m) => ({ default: m.ProjectsDashboardPage }))
)
const DiagramEditorPage = lazy(() =>
  import("@/features/diagram/pages/DiagramEditorPage").then((m) => ({ default: m.DiagramEditorPage }))
)
const ProjectTasksPage = lazy(() =>
  import("@/features/tasks/pages/ProjectTasksPage").then((m) => ({ default: m.ProjectTasksPage }))
)
const ProjectNotesPage = lazy(() =>
  import("@/features/notes/pages/ProjectNotesPage").then((m) => ({ default: m.ProjectNotesPage }))
)
const ProjectXmiPage = lazy(() =>
  import("@/features/xmi/pages/ProjectXmiPage").then((m) => ({ default: m.ProjectXmiPage }))
)
const ProjectGeneratorPage = lazy(() =>
  import("@/features/generator/pages/ProjectGeneratorPage").then((m) => ({ default: m.ProjectGeneratorPage }))
)

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function App() {
  const isAuthenticated = Boolean(localStorage.getItem("token"))
  const { theme } = useTheme()

  return (
    <TooltipProvider>
      <Toaster richColors position="top-right" theme={theme} />
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </TooltipProvider>
  )
}

export default App

