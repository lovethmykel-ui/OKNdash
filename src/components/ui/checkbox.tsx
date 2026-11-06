"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  id?: string
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

export function Checkbox({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const isChecked = checked === true

  return (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled && onCheckedChange) {
          onCheckedChange(!isChecked)
        }
      }}
      className={cn(
        "peer size-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors cursor-pointer",
        isChecked ? "bg-primary text-primary-foreground" : "bg-transparent",
        className
      )}
    >
      {isChecked && <Check className="size-3.5 stroke-[3]" />}
    </button>
  )
}
