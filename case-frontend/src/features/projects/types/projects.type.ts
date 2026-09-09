export type RolProyecto = 'ADMIN' | 'COLABORADOR' | 'LECTOR';

//pal get proyecto
export interface listarProyectosResponse {
  id: number;
  nombre: string;
  descripcion: string;
  miRol: RolProyecto;
  createdAt: string;
}

// post y put, osea lo q enviamos al actulaizar o crear un proyecto
export interface ProyectoRequest {
  nombre: string;
  descripcion: string;
}

export interface ProyectoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  rol: RolProyecto;
  createdAt: string;
}

// get para miembros del proyecto
export interface MiembroProyectoResponse {
  id: number;
  usuarioId: number;
  username: string;
  email: string;
  rol: RolProyecto;
  createdAt: string;
}

// Lo que envías en POST /api/proyectos/{id}/miembros (invitar)
export interface MiembroProyectoRequest {
  usernameOrEmail: string;
  rol: RolProyecto;
}
