import { RegisterForm } from "../components/register-form/register-form"

export function RegisterPage() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center p-4 py-8 overflow-y-auto"
      style={{ minHeight: "var(--visual-viewport-height, 100dvh)" }}
    >
      <RegisterForm />
    </div>
  )
}
