import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLogin } from "../../hooks/useLogin"
import { loginFormData } from "./login-form.data"

export function LoginForm() {
  const { login, loading, error } = useLogin()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login({ usernameOrEmail, password })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{loginFormData.title}</CardTitle>
        <CardDescription>{loginFormData.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="usernameOrEmail">
                {loginFormData.fields.usernameOrEmail.label}
              </FieldLabel>
              <Input
                id="usernameOrEmail"
                type={loginFormData.fields.usernameOrEmail.type}
                placeholder={loginFormData.fields.usernameOrEmail.placeholder}
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{loginFormData.fields.password.label}</FieldLabel>
              <Input
                id="password"
                type={loginFormData.fields.password.type}
                placeholder={loginFormData.fields.password.placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? loginFormData.submitButton.loadingText : loginFormData.submitButton.idleText}
              </Button>
              <FieldDescription className="text-center">
                {loginFormData.registerLink.text}{" "}
                <Link to={loginFormData.registerLink.href}>{loginFormData.registerLink.actionText}</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
