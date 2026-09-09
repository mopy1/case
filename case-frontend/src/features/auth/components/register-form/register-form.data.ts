export const registerFormData = {
  title: "Registro",
  subtitle: "Crea una cuenta para iniciar sesión",
  fields: {
    username: {
      label: "usuario",
      placeholder: "usuario",
      type: "text",
    },
    email: {
      label: "correo",
      placeholder: "usuario@ejemplo.com",
      type: "email",
    },
    password: {
      label: "contraseña",
      placeholder: "••••••••",
      type: "password",
    },
  },
  submitButton: {
    idleText: "Registrarse",
    loadingText: "Creando cuenta...",
  },
  loginLink: {
    text: "¿Ya tienes cuenta?",
    actionText: "Iniciar sesión",
    href: "/login",
  },
}
