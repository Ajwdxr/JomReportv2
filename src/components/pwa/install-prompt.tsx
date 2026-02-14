"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

const DISMISS_KEY = "jomreport_install_dismissed"
const DISMISS_DAYS = 30 // Don't show again for 30 days after dismiss

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user already dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const dismissedAt = new Date(dismissed).getTime()
      const now = Date.now()
      const daysSince = (now - dismissedAt) / (1000 * 60 * 60 * 24)
      if (daysSince < DISMISS_DAYS) return
    }

    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`Install prompt: ${outcome}`)
    setDeferredPrompt(null)
    setShowPrompt(false)
    // If installed, don't show again
    localStorage.setItem(DISMISS_KEY, new Date().toISOString())
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(DISMISS_KEY, new Date().toISOString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Pasang JomReport App
          </h3>
          <p className="text-xs text-muted-foreground">
            Akses lebih pantas & notifikasi terus di telefon anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleInstallClick} 
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9"
          >
            <Download className="h-3.5 w-3.5" />
            Pasang
          </Button>
        </div>
      </div>
    </div>
  )
}
