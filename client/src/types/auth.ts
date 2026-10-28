export interface AuthUser {
  id: string
  name: string
  email: string
  username: string | null
  displayName: string | null
  bio: string | null
  createdAt: string
  updatedAt?: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface ApiError {
  error: string
}

export interface ProfileFormData {
  username: string
  displayName: string
  bio: string
}
