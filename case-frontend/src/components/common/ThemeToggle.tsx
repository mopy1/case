import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  size?: "default" | "sm" | "xs" | "icon" | "icon-sm" | "icon-xs" | "lg"
  tooltipSide?: "top" | "bottom" | "left" | "right"
}

export function ThemeToggle({
  className,
  size = "icon",
  tooltipSide = "bottom",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={size}
            onClick={toggleTheme}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className={cn("transition-colors", className)}
          >
            {isDark ? (
              <Sun className="size-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="size-4 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </Button>
        }
      />
      <TooltipContent side={tooltipSide}>
        {isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      </TooltipContent>
    </Tooltip>
  )
}
