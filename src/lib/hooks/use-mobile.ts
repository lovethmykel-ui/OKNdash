import * as React from "react"
import { useHydrated } from "@/lib/hooks/use-hydrated"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const hydrated = useHydrated()
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    if (!hydrated) return
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    onChange()
    mql.addEventListener("change", onChange)
    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [hydrated])

  return hydrated ? isMobile : false
}
