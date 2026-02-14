import { WifiOff, RotateCw } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded-full blur-2xl opacity-50 animate-pulse" />
        <div className="relative bg-slate-100 dark:bg-slate-800 p-6 rounded-full shadow-xl">
          <WifiOff className="w-12 h-12 text-slate-400 dark:text-slate-500" />
        </div>
      </div>
      
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tiada Sambungan Internet
        </h1>
        <p className="text-muted-foreground">
          Sambungan anda terputus. Sila periksa rangkaian anda dan cuba lagi.
        </p>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-all shadow-lg active:scale-95"
      >
        <RotateCw className="w-4 h-4" />
        Cuba Lagi
      </button>
    </div>
  )
}
