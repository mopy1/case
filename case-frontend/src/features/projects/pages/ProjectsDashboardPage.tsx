import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatarMenu } from "@/components/common/UserAvatarMenu"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { useProjects } from "../hooks/useProjects"
import { ProjectCard } from "../components/project-card/project-card"
import { CreateProjectDialog } from "../components/create-project-dialog/create-project-dialog"

/** Misión 1 de la Guía: el usuario crea su propio proyecto de práctica (prellenado, editable). */
const PRACTICA = { nombre: "Práctica — Biblioteca", descripcion: "Proyecto de práctica para la inducción: Libro, Autor y Préstamo." }

export function ProjectsDashboardPage() {
  const { projects, loading, error, getMyProjects } = useProjects()
  const [busqueda, setBusqueda] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  // Se lee una vez al montar (el diálogo se monta recién cuando termina la carga) y se apaga al crear:
  // si no, el diálogo de la grilla se volvería a abrir solo al pasar de 0 a 1 proyecto.
  const [abrirPractica, setAbrirPractica] = useState(() => searchParams.get("nuevo") === "practica")
  const alCrear = () => {
    setAbrirPractica(false)
    void getMyProjects()
  }

  useEffect(() => {
    if (searchParams.has("nuevo")) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const filtrados = useMemo(
    () => projects.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    [projects, busqueda]
  )

  let content: React.ReactNode = null
  if (loading) {
    content = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full max-w-sm">
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  } else if (!error && projects.length === 0) {
    content = (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Todavía no tenés proyectos</EmptyTitle>
          <EmptyDescription>
            Creá un proyecto de práctica para aprender: adentro, la Guía del Copilot te acompaña paso a paso.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateProjectDialog onCreated={alCrear} defaultOpen={abrirPractica} sugerencia={PRACTICA} />
        </EmptyContent>
      </Empty>
    )
  } else if (!error && filtrados.length === 0) {
    content = (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Sin resultados</EmptyTitle>
          <EmptyDescription>Ningún proyecto coincide con "{busqueda}".</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  } else if (!error) {
    content = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((proyecto) => (
          <ProjectCard key={proyecto.id} proyecto={proyecto} onChanged={() => getMyProjects()} />
        ))}
        <CreateProjectDialog
          onCreated={alCrear}
          defaultOpen={abrirPractica}
          sugerencia={abrirPractica ? PRACTICA : undefined}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proyectos</h1>
          <p className="text-muted-foreground">Modelos de base de datos en los que colaborás.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar proyectos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:w-64"
          />
          <ThemeToggle tooltipSide="bottom" />
          <UserAvatarMenu align="end" />
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>No se pudieron cargar los proyectos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {content}
    </div>
  )
}
