export const loginFormData = {
  title: "Iniciar sesión",
  subtitle: "Ingresa a la herramienta CASE para modelar tus bases de datos",
  fields: {
    usernameOrEmail: {
      label: "Usuario o correo",
      placeholder: "usuario o usuario@ejemplo.com",
      type: "text",
    },
    password: {
      label: "Contraseña",
      placeholder: "••••••••",
      type: "password",
    },
  },
  submitButton: {
    idleText: "Entrar",
    loadingText: "Iniciando sesión...",
  },
  registerLink: {
    text: "¿No tienes cuenta?",
    actionText: "Regístrate aquí",
    href: "/register",
  },
}
