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
import { useRegister } from "../../hooks/useRegister"
import { registerFormData } from "./register-form.data"

export function RegisterForm() {
  const { register, loading, error } = useRegister()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    register({ username, email, password })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{registerFormData.title}</CardTitle>
        <CardDescription>{registerFormData.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">
                {registerFormData.fields.username.label}
              </FieldLabel>
              <Input
                id="username"
                type={registerFormData.fields.username.type}
                placeholder={registerFormData.fields.username.placeholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">
                {registerFormData.fields.email.label}
              </FieldLabel>
              <Input
                id="email"
                type={registerFormData.fields.email.type}
                placeholder={registerFormData.fields.email.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{registerFormData.fields.password.label}</FieldLabel>
              <Input
                id="password"
                type={registerFormData.fields.password.type}
                placeholder={registerFormData.fields.password.placeholder}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? registerFormData.submitButton.loadingText : registerFormData.submitButton.idleText}
              </Button>
              <FieldDescription className="text-center">
                {registerFormData.loginLink.text}{" "}
                <Link to={registerFormData.loginLink.href}>{registerFormData.loginLink.actionText}</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
