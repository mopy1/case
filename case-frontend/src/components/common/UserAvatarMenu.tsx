import { LogOut, Moon, Sun } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "@/contexts/ThemeContext"
import { colorAvatar, iniciales } from "@/lib/avatar"

interface UserAvatarMenuProps {
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function UserAvatarMenu({ side = "bottom", align = "end" }: UserAvatarMenuProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  if (!user) return null

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menú de usuario: ${user.username}`}
        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Avatar size="sm" className="ring-2 ring-primary">
          <AvatarFallback className={colorAvatar(user.id)}>{iniciales(user.username)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === "dark" ? (
            <>
              <Sun className="size-4 text-amber-400" />
              <span>Modo claro</span>
            </>
          ) : (
            <>
              <Moon className="size-4 text-slate-700" />
              <span>Modo oscuro</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
