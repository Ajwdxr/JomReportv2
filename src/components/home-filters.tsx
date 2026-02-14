"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { LayoutGrid, Clock, Loader2, CheckCircle2, Search, Car, Lightbulb, Trash2, ShieldAlert, HelpCircle, SlidersHorizontal, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "use-debounce"

const categories = [
    { value: "all", label: "Semua" },
    { value: "Roads", label: "Jalan", icon: Car },
    { value: "Lighting", label: "Lampu", icon: Lightbulb },
    { value: "Waste", label: "Sampah", icon: Trash2 },
    { value: "Safety", label: "Keselamatan", icon: ShieldAlert },
    { value: "Other", label: "Lain-lain", icon: HelpCircle },
]

const statuses = [
    { value: "all", label: "Semua", icon: LayoutGrid },
    { value: "open", label: "Baru", icon: Clock },
    { value: "in_progress", label: "Proses", icon: Loader2 },
    { value: "closed", label: "Selesai", icon: CheckCircle2 },
]

export function HomeFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [isOpen, setIsOpen] = useState(false)
    const currentStatus = searchParams.get("status") || "all"
    const currentCategory = searchParams.get("category") || "all"
    const currentSearch = searchParams.get("q") || ""
    const [searchTerm, setSearchTerm] = useState(currentSearch)
    const [debouncedSearch] = useDebounce(searchTerm, 500)

    const activeFilterCount = (currentStatus !== "all" ? 1 : 0) + (currentCategory !== "all" ? 1 : 0)

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

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
            {/* Search Bar + Filter Toggle Row */}
            <div className="flex items-center gap-2 w-full max-w-lg">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 z-10" />
                    <Input 
                        placeholder="Cari aduan..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-9 h-11 rounded-xl bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/50 shadow-sm text-sm"
                    />
                    {searchTerm && (
                        <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 z-10">
                            <X className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "relative flex items-center gap-1.5 h-11 px-4 rounded-xl text-sm font-medium transition-all border shadow-sm",
                        isOpen
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/25"
                            : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Tapis</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
                    {activeFilterCount > 0 && !isOpen && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Collapsible Filter Panel */}
            <div className={cn(
                "w-full overflow-hidden transition-all duration-300 ease-out",
                isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg p-4 space-y-4 max-w-lg mx-auto">
                    {/* Status */}
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Status</p>
                        <div className="flex flex-wrap gap-1.5">
                            {statuses.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => updateParam("status", value)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        currentStatus === value
                                            ? "bg-indigo-500 text-white shadow-sm"
                                            : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200/80 dark:border-slate-700/50" />

                    {/* Category */}
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Kategori</p>
                        <div className="flex flex-wrap gap-1.5">
                            {categories.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => updateParam("category", value)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        currentCategory === value
                                            ? "bg-indigo-500 text-white shadow-sm"
                                            : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                                    )}
                                >
                                    {Icon && <Icon className="h-3.5 w-3.5" />}
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reset */}
                    {(currentStatus !== "all" || currentCategory !== "all") && (
                        <button
                            onClick={() => router.push("/")}
                            className="w-full text-center text-xs text-indigo-500 hover:text-indigo-400 font-medium py-1 hover:underline"
                        >
                            Reset semua filter
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
