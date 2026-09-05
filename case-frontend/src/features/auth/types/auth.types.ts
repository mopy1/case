export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface AuthResponse {
  id: number
  username: string
  email: string
  fullname: string
  token: string
}
