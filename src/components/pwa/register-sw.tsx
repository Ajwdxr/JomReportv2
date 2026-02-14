"use client"

import { useEffect } from "react"

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && (window as any).workbox !== undefined) {
      const wb = (window as any).workbox
      wb.register()
    }
  }, [])
  return null
}
