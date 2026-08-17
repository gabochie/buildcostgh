"use client"

import { useState } from "react"
import { Eye, EyeOff, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function generatePassword(length = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lower = "abcdefghijklmnopqrstuvwxyz"
  const digits = "0123456789"
  const symbols = "!@#$%&*?"
  const all = upper + lower + digits + symbols

  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)

  let pw = ""
  pw += upper[arr[0] % upper.length]
  pw += lower[arr[1] % lower.length]
  pw += digits[arr[2] % digits.length]
  pw += symbols[arr[3] % symbols.length]
  for (let i = 4; i < length; i++) pw += all[arr[i] % all.length]

  return pw
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  showGenerate?: boolean
  className?: string
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = "At least 8 characters",
  autoComplete = "new-password",
  showGenerate = true,
  className = "h-11",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          className={`${className} pr-20`}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {showGenerate && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-emerald-600"
              onClick={() => onChange(generatePassword())}
              title="Generate strong password"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            onClick={() => setVisible(!visible)}
            title={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
