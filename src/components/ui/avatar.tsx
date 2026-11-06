"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg"
}

function Avatar({ className, size = "default", ...props }: AvatarProps) {
  return (
    <div
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none overflow-hidden border border-border/40 bg-[var(--s2)]",
        size === "lg" && "size-10",
        size === "sm" && "size-6",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      data-slot="avatar-image"
      alt={alt}
      className={cn("aspect-square size-full rounded-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-[var(--s2)] text-xs font-bold text-[var(--tx)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
