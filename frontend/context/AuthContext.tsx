"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react"

import type { User } from '@/types'

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (
    username: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

 useEffect(() => {
  const token = localStorage.getItem("access");
  const username = localStorage.getItem("username");

  if (!token || !username) {
    return;
  }

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/token-account/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid or expired session");
      }

      return response.json();
    })
    .then(() => {
      setUser({
        id: 1,
        username,
        email: "",
        name: username,
      });
    })
    .catch(() => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("username");
      setUser(null);
    });
}, []);

  const login = async (
  username: string,
  password: string
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/login/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Login failed")
  }

  localStorage.setItem("access", data.access)
  localStorage.setItem("refresh", data.refresh)
  localStorage.setItem("username", username)

  setUser({
    id: 1,
    username,
    email: "",
    name: username,
  })
}

const register = async (
  username: string,
  password: string,
  confirmPassword: string
) => {

  console.log("BEFORE FETCH");
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/register/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        confirm_password: confirmPassword,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(JSON.stringify(data))
  }
}

  const logout = () => {
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
  localStorage.removeItem("username")
  setUser(null)
}

  return (
    <AuthContext.Provider
      value={{
  user,
  login,
  register,
  logout,
  isAuthenticated: !!user,
}}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}