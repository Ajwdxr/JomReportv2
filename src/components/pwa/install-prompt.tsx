"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Update UI notify the user they can install the PWA
      setShowPrompt(true)
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
       setShowPrompt(false) // App is installed
       return
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setShowPrompt(false)
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
            onClick={() => setShowPrompt(false)}
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
