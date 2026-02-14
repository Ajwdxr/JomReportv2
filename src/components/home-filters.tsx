"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Filter, LayoutGrid, Clock, Loader2, CheckCircle2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "use-debounce"

export function HomeFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [isOpen, setIsOpen] = useState(false)
    const currentStatus = searchParams.get("status") || "all"
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

    const handleFilter = (status: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (status === "all") {
            params.delete("status")
        } else {
            params.set("status", status)
        }
        router.push(`/?${params.toString()}`)
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input 
                    placeholder="Cari aduan..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-12 rounded-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-sm"
                />
            </div>

             <Button 
                onClick={() => setIsOpen(!isOpen)} 
                variant="secondary" 
                className="rounded-full px-6 py-2 h-auto flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-medium"
            >
                <Filter className="h-4 w-4" />
                <span>Tapis Laporan</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
             </Button>

             <div className={cn(
                 "w-full grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                 isOpen ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr] mt-0"
             )}>
                <div className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-center gap-3 pb-2">
                        <Button 
                            onClick={() => handleFilter("all")}
                            className={cn(
                                "flex-1 min-w-[140px] rounded-2xl py-6 transition-all hover:scale-105 border-0 shadow-lg",
                                currentStatus === "all" 
                                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-indigo-500/25" 
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                        >
                            <LayoutGrid className="mr-2 h-5 w-5" />
                            <span className="font-semibold text-base">Semua</span>
                        </Button>

                        <Button 
                            onClick={() => handleFilter("open")}
                            className={cn(
                                "flex-1 min-w-[140px] rounded-2xl py-6 transition-all hover:scale-105 border-0 shadow-lg",
                                currentStatus === "open" 
                                    ? "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-orange-500/25" 
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                        >
                            <Clock className="mr-2 h-5 w-5" />
                            <span className="font-semibold text-base">Baru</span>
                        </Button>

                        <Button 
                            onClick={() => handleFilter("in_progress")}
                            className={cn(
                                "flex-1 min-w-[140px] rounded-2xl py-6 transition-all hover:scale-105 border-0 shadow-lg",
                                currentStatus === "in_progress" 
                                    ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-blue-500/25" 
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                        >
                            <Loader2 className="mr-2 h-5 w-5" />
                            <span className="font-semibold text-base">Proses</span>
                        </Button>

                        <Button 
                            onClick={() => handleFilter("closed")}
                            className={cn(
                                "flex-1 min-w-[140px] rounded-2xl py-6 transition-all hover:scale-105 border-0 shadow-lg",
                                currentStatus === "closed" 
                                    ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-emerald-500/25" 
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                        >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            <span className="font-semibold text-base">Selesai</span>
                        </Button>
                    </div>
                </div>
             </div>
        </div>
    )
}
