"use client"

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LANGUAGES, ROLES, type Role } from "@/lib/api-config"

interface LanguageRoleSelectorProps {
  role: Role
  language: string
  onLanguageChange: (value: string) => void
  label: string
  tooltip: string
}

export function LanguageRoleSelector({ role, language, onLanguageChange, label, tooltip }: LanguageRoleSelectorProps) {
  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select value={language} onValueChange={onLanguageChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="text-xs text-muted-foreground mt-1">
        {role === ROLES.DOCTOR ? "Healthcare Provider's Language" : "Patient's Language"}
      </div>
    </div>
  )
}

