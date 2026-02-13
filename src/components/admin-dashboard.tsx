"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { 
  MoreHorizontal, 
  MapPin, 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  FileText
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "sonner"
// Server actions not directly imported here to keep it pure client if possible, 
// using supabase client for data fetching, but actions for mutations.
// Wait, we need to import actions for mutations.
import { updateReportStatus, toggleReportVisibility, toggleReportLock, banUser } from "@/app/actions/admin"

export function AdminDashboard() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const observer = useRef<IntersectionObserver | null>(null)
  const supabase = createClient()
  const PAGE_SIZE = 10

  const lastReportElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [page])

  const fetchReports = async () => {
    setLoading(true)
    setErrorMsg(null)
    
    try {
        // 1. Fetch reports
        const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*, updates(count)")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (reportsError) throw reportsError

        if (reportsData) {
            // 2. Fetch profiles for these reports manually to avoid relationship ambiguity
            const userIds = Array.from(new Set(reportsData.map(r => r.creator_id).filter(Boolean)))
            let profilesMap: Record<string, any> = {}
            
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("*")
                    .in("id", userIds)
                
                if (profilesData) {
                    profilesData.forEach(p => {
                        profilesMap[p.id] = p
                    })
                }
            }

            // 3. Merge profiles into reports
            const reportsWithProfiles = reportsData.map(r => ({
                ...r,
                profiles: profilesMap[r.creator_id] || { name: 'Unknown', avatar_url: null, is_banned: false }
            }))

            setReports(prev => {
                if (page === 0) return reportsWithProfiles
                // Filter duplicates
                const newReports = reportsWithProfiles.filter(d => !prev.some(p => p.id === d.id))
                return [...prev, ...newReports]
            })
            setHasMore(reportsData.length === PAGE_SIZE)
        }
    } catch (err: any) {
        console.error(err)
        setErrorMsg(err.message)
    } finally {
        setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
        await updateReportStatus(id, newStatus)
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
        toast.success(`Status updated to ${newStatus}`)
    } catch (e) {
        toast.error("Failed to update status")
    }
  }

  const handleToggleHide = async (id: string, currentHidden: boolean) => {
    try {
        await toggleReportVisibility(id, !currentHidden)
        setReports(prev => prev.map(r => r.id === id ? { ...r, is_hidden: !currentHidden } : r))
        toast.success(currentHidden ? "Report visible" : "Report hidden")
    } catch (e) {
        toast.error("Failed to toggle visibility")
    }
  }

  const handleToggleLock = async (id: string, currentLocked: boolean) => {
    try {
        await toggleReportLock(id, !currentLocked)
        setReports(prev => prev.map(r => r.id === id ? { ...r, is_locked: !currentLocked } : r))
        toast.success(currentLocked ? "Report unlocked" : "Report locked")
    } catch (e) {
        toast.error("Failed to toggle lock")
    }
  }

  const handleBanUser = async (userId: string, currentBanned: boolean) => {
    if (!userId) return
    try {
        await banUser(userId, !currentBanned)
        // Optimistically update banning UI on all reports by this user
        setReports(prev => prev.map(r => r.creator_id === userId ? { ...r, profiles: { ...r.profiles, is_banned: !currentBanned } } : r))
        toast.success(currentBanned ? "User unbanned" : "User banned")
    } catch (e) {
        toast.error("Failed to ban user")
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'open': return 'bg-blue-500 hover:bg-blue-600'
        case 'in_progress': return 'bg-yellow-500 hover:bg-yellow-600'
        case 'closed': return 'bg-green-500 hover:bg-green-600'
        case 'acknowledged': return 'bg-purple-500 hover:bg-purple-600'
        default: return 'bg-slate-500'
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((report, index) => {
        const isLast = index === reports.length - 1
        return (
            <Card key={report.id} ref={isLast ? lastReportElementRef : null} className={`relative overflow-hidden transition-all hover:shadow-md ${report.is_hidden ? 'opacity-60 bg-muted/50' : ''}`}>
                {report.is_hidden && (
                    <div className="absolute top-0 right-0 p-2 bg-yellow-100 text-yellow-800 rounded-bl-xl z-20 text-xs font-bold flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> HIDDEN
                    </div>
                )}
                {report.is_locked && (
                    <div className="absolute top-0 left-0 p-2 bg-red-100 text-red-800 rounded-br-xl z-20 text-xs font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> LOCKED
                    </div>
                )}

                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={report.profiles?.avatar_url} />
                                <AvatarFallback>{report.profiles?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className={`text-sm font-semibold truncate max-w-[120px] ${report.profiles?.is_banned ? 'line-through text-red-500' : ''}`}>
                                    {report.profiles?.name || "Unknown"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                        <Badge className={`${getStatusColor(report.status)} text-white border-none capitalize`}>
                            {report.status.replace("_", " ")}
                        </Badge>
                    </div>
                </CardHeader>
                
                <CardContent className="pb-3 space-y-2">
                    <h3 className="font-bold leading-tight line-clamp-2">{report.title}</h3>
                    {report.photo_url && (
                        <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={report.photo_url} alt="Report" className="object-cover w-full h-full" />
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {report.description}
                    </p>
                    {report.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{report.location.address || "Location pinned"}</span>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-0 flex justify-between items-center border-t p-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Select defaultValue={report.status} onValueChange={(val) => handleStatusChange(report.id, val)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleToggleHide(report.id, report.is_hidden)}>
                                {report.is_hidden ? <><Eye className="mr-2 h-4 w-4" /> Unhide Report</> : <><EyeOff className="mr-2 h-4 w-4" /> Hide Report</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleLock(report.id, report.is_locked)}>
                                {report.is_locked ? <><Unlock className="mr-2 h-4 w-4" /> Unlock Comments</> : <><Lock className="mr-2 h-4 w-4" /> Lock Comments</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => handleBanUser(report.creator_id, report.profiles?.is_banned)}
                                className={report.profiles?.is_banned ? "text-green-600" : "text-red-600"}
                            >
                                <Shield className="mr-2 h-4 w-4" />
                                {report.profiles?.is_banned ? "Unban User" : "Ban User"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
        )
      })}
      {loading && <div className="col-span-full py-10 text-center text-muted-foreground">Loading more reports...</div>}
      {!loading && !hasMore && reports.length > 0 && (
          <div className="col-span-full py-10 text-center text-muted-foreground border-t mt-4 pt-4">No more reports to show.</div>
      )}
      {errorMsg ? (
          <div className="col-span-full py-20 text-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 border-dashed flex flex-col items-center justify-center">
              <AlertTriangle className="h-10 w-10 mb-4 opacity-50" />
              <p>Error loading reports:</p>
              <p className="font-mono text-xs mt-2">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={() => { setPage(0); fetchReports(); }} className="mt-4">Try Again</Button>
          </div>
      ) : (
          !loading && reports.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed flex flex-col items-center justify-center">
                  <FileText className="h-10 w-10 mb-4 opacity-50" />
                  <p>No reports found.</p>
              </div>
          )
      )}
    </div>
  )
}
