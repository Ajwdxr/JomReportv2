"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { MapPin, Calendar, Tag, ThumbsUp, MessageSquare, MoreVertical, Flag } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface ReportCardProps {
  report: any
}

export function ReportCard({ report }: ReportCardProps) {
  const supabase = createClient()

  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleFlag = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        toast.error("Please login to flag reports")
        return
    }

    const { error } = await supabase.from("flags").insert({
        user_id: user.id,
        report_id: report.id,
        reason: "Reported via Flag Button"
    })

    if (error) {
        if (error.code === '23505') {
            toast.info("You have already flagged this report")
        } else {
            toast.error("Failed to submit flag")
            console.error(error)
        }
    } else {
        toast.success("Report flagged for review")
    }
  }

  const statusColors: Record<string, string> = {
    open: "bg-[#3b82f6] text-white hover:bg-[#2563eb]",
    acknowledged: "bg-yellow-500 text-black hover:bg-yellow-600",
    in_progress: "bg-orange-500 text-white hover:bg-orange-600",
    closed: "bg-green-500 text-white hover:bg-green-600",
  }

  const categoryIcon = <Tag className="h-3 w-3 mr-1" />

  return (
    <div className="relative group">
        {/* Actions Dropdown */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                        onClick={handleFlag}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <Flag className="mr-2 h-4 w-4" />
                        Report Abuse
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <Link href={`/report/${report.id}`} className="block h-full">
            <Card className="h-full flex flex-col overflow-hidden bg-[#1e293b] border-none text-white hover:ring-2 hover:ring-[#6366f1] transition-all duration-200">
                {/* Image Section */}
                <div className="relative h-48 w-full bg-[#334155]">
                    {report.photo_url ? (
                        <Image
                            src={report.photo_url}
                            alt={report.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            No Image Available
                        </div>
                    )}
                </div>

                <CardContent className="flex-1 p-4 space-y-3">
                    {/* Tags Row */}
                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-[#334155] text-[#94a3b8] hover:bg-[#475569] uppercase text-[10px] tracking-wider font-bold px-2 py-1">
                            {categoryIcon} {report.category}
                        </Badge>
                        <Badge className={cn("uppercase text-[10px] font-bold px-2 py-1", statusColors[report.status] || "bg-gray-500")}>
                            {report.status?.replace("_", " ")}
                        </Badge>
                    </div>

                    {/* Content */}
                    <div>
                         <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">{report.title}</h3>
                         <p className="text-sm text-gray-400 line-clamp-2">{report.description}</p>
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex items-center justify-between text-gray-400 text-xs text-[#94a3b8]">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={report.profiles?.avatar_url} />
                            <AvatarFallback className="text-[10px] bg-[#6366f1] text-white">
                                {report.profiles?.name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-white truncate max-w-[100px]">
                            {report.profiles?.name || "Anonymous"}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 hover:text-white transition-colors">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{report.likes?.[0]?.count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 hover:text-white transition-colors">
                             <MessageSquare className="h-3 w-3" />
                             <span>{report.updates?.[0]?.count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                                {mounted ? (report.created_at ? format(new Date(report.created_at), "d/M/yyyy") : "N/A") : "..."}
                            </span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    </div>
  )
}
