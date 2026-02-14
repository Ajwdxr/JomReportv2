"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LayoutGrid, Clock, Loader2, CheckCircle2, Search, Car, Lightbulb, Trash2, ShieldAlert, HelpCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "use-debounce"

const categories = [
    { value: "all", label: "Semua", icon: LayoutGrid },
    { value: "Roads", label: "Jalan", icon: Car },
    { value: "Lighting", label: "Lampu", icon: Lightbulb },
    { value: "Waste", label: "Sampah", icon: Trash2 },
    { value: "Safety", label: "Keselamatan", icon: ShieldAlert },
    { value: "Other", label: "Lain-lain", icon: HelpCircle },
]

const statuses = [
    { value: "all", label: "Semua", icon: LayoutGrid, gradient: "from-indigo-500 to-violet-500", shadow: "shadow-indigo-500/25" },
    { value: "open", label: "Baru", icon: Clock, gradient: "from-orange-400 to-amber-500", shadow: "shadow-orange-500/25" },
    { value: "in_progress", label: "Proses", icon: Loader2, gradient: "from-blue-400 to-cyan-500", shadow: "shadow-blue-500/25" },
    { value: "closed", label: "Selesai", icon: CheckCircle2, gradient: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-500/25" },
]

export function HomeFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const currentStatus = searchParams.get("status") || "all"
    const currentCategory = searchParams.get("category") || "all"
    const currentSearch = searchParams.get("q") || ""
    const [searchTerm, setSearchTerm] = useState(currentSearch)
    const [debouncedSearch] = useDebounce(searchTerm, 500)

    // Sync URL with Search
    useEffect(() => {
        if (debouncedSearch === currentSearch) return
        
        const params = new URLSearchParams(searchParams.toString())
        if (debouncedSearch) {
            params.set("q", debouncedSearch)
        } else {
            params.delete("q")
        }
        router.push(`/?${params.toString()}`)
    }, [debouncedSearch, router, searchParams, currentSearch])

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === "all") {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`/?${params.toString()}`)
    }

    const clearSearch = () => {
        setSearchTerm("")
        const params = new URLSearchParams(searchParams.toString())
        params.delete("q")
        router.push(`/?${params.toString()}`)
    }

    const hasActiveFilters = currentStatus !== "all" || currentCategory !== "all" || currentSearch !== ""

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-5">
            {/* Search Bar */}
            <div className="relative w-full max-w-lg group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
                <div className="relative flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-slate-400 dark:text-slate-500 z-10 transition-colors group-focus-within:text-indigo-500" />
                    <Input 
                        placeholder="Cari laporan mengikut tajuk, penerangan..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-10 h-13 rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-sm border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-400 transition-all"
                    />
                    {searchTerm && (
                        <button 
                            onClick={clearSearch}
                            className="absolute right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
                        >
                            <X className="h-4 w-4 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Pills - Always Visible */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {categories.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        onClick={() => updateParam("category", value)}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95",
                            currentCategory === value
                                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                                : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Status Filter */}
            <div className="w-full">
                <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
                    {statuses.map(({ value, label, icon: Icon, gradient, shadow }) => (
                        <button
                            key={value}
                            onClick={() => updateParam("status", value)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95",
                                currentStatus === value
                                    ? `bg-gradient-to-br ${gradient} text-white shadow-lg ${shadow}`
                                    : "bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-200/60 dark:border-slate-700/60"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", currentStatus === value && value === "in_progress" && "animate-spin")} />
                            <span className="text-xs font-semibold tracking-wide">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Filters Indicator */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span>
                        {currentCategory !== "all" && `Kategori: ${categories.find(c => c.value === currentCategory)?.label}`}
                        {currentCategory !== "all" && currentStatus !== "all" && " • "}
                        {currentStatus !== "all" && `Status: ${statuses.find(s => s.value === currentStatus)?.label}`}
                        {(currentCategory !== "all" || currentStatus !== "all") && currentSearch && " • "}
                        {currentSearch && `Carian: "${currentSearch}"`}
                    </span>
                    <button
                        onClick={() => {
                            setSearchTerm("")
                            router.push("/")
                        }}
                        className="ml-1 text-indigo-500 hover:text-indigo-400 font-medium hover:underline"
                    >
                        Reset
                    </button>
                </div>
            )}
        </div>
    )
}
