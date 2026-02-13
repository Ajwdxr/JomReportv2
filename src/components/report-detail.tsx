"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { MapPin, CheckCircle, MessageSquare, ThumbsUp, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ReportDetailProps {
  report: any
  currentUser: any
  isFollowing: boolean
  hasConfirmed: boolean
  isLiked: boolean
  likesCount: number
}

export function ReportDetail({ report, currentUser, isFollowing: initialIsFollowing, hasConfirmed: initialHasConfirmed, isLiked: initialIsLiked, likesCount: initialLikesCount }: ReportDetailProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [confirmations, setConfirmations] = useState<number>(report.confirmations?.[0]?.count || 0)
  const [hasConfirmed, setHasConfirmed] = useState(initialHasConfirmed)
  const [updates, setUpdates] = useState(report.updates || [])
  const [newUpdate, setNewUpdate] = useState("")
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  
  const supabase = createClient()
  const router = useRouter()

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Please login to follow")
    
    if (isFollowing) {
      const { error } = await supabase.from("follows").delete().match({ user_id: currentUser.id, report_id: report.id })
      if (!error) setIsFollowing(false)
    } else {
      const { error } = await supabase.from("follows").insert({ user_id: currentUser.id, report_id: report.id })
      if (!error) setIsFollowing(true)
    }
    router.refresh()
  }

  const handleLike = async () => {
    if (!currentUser) return toast.error("Please login to like")

    // Optimistic update
    const previousIsLiked = isLiked
    const previousLikesCount = likesCount
    
    setIsLiked(!isLiked)
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)

    if (isLiked) {
         const { error } = await supabase.from("likes").delete().match({ user_id: currentUser.id, report_id: report.id })
         if (error) {
             setIsLiked(previousIsLiked)
             setLikesCount(previousLikesCount)
             toast.error("Failed to unlike")
         }
    } else {
         const { error } = await supabase.from("likes").insert({ user_id: currentUser.id, report_id: report.id })
         
         if (error) {
             // Ignore unique constraint violation (already liked)
             if (error.code !== '23505') {
                 setIsLiked(previousIsLiked)
                 setLikesCount(previousLikesCount)
                 toast.error("Failed to like")
             }
         }
    }
    router.refresh()
  }

  const handleConfirm = async () => {
    if (!currentUser) return toast.error("Please login to confirm")
    if (hasConfirmed) return
    
    setIsConfirming(true)
    const { error } = await supabase.from("confirmations").insert({ user_id: currentUser.id, report_id: report.id })
    
    if (error) {
      toast.error("Failed to confirm")
    } else {
      setHasConfirmed(true)
      setConfirmations((prev) => prev + 1)
      toast.success("Thanks for confirming!")
      if (confirmations + 1 >= 3) {
        toast.success("Report confirmed fixed! Status updated.")
      }
      router.refresh()
    }
    setIsConfirming(false)
  }

  const handleSubmitUpdate = async () => {
    if (!currentUser) return toast.error("Please login to post comments")
    if (!newUpdate.trim()) return

    setIsSubmittingUpdate(true)

    // Rate Limit Check: 5 updates per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
        .from("updates")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", currentUser.id)
        .gte("created_at", oneHourAgo)

    if (count !== null && count >= 5) {
        toast.error("Rate limit exceeded (5 comments/hour). Please wait.")
        setIsSubmittingUpdate(false)
        return
    }

    const { data, error } = await supabase.from("updates").insert({
        report_id: report.id,
        user_id: currentUser.id,
        content: newUpdate
    }).select().single()

    if (error) {
        toast.error("Failed to post comment")
    } else {
        const updateWithProfile = {
            ...data,
            profiles: {
                name: currentUser.user_metadata?.full_name || "User",
                avatar_url: currentUser.user_metadata?.avatar_url
            }
        }
        setUpdates([updateWithProfile, ...updates])
        setNewUpdate("")
        toast.success("Comment posted")
    }
    setIsSubmittingUpdate(false)
  }

  const statusSteps = ["open", "acknowledged", "in_progress", "closed"]
  const currentStepIndex = statusSteps.indexOf(report.status)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{report.category}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
            </div>
        </div>
        <div className="ml-auto flex gap-2">
            <Button 
                variant={isLiked ? "default" : "outline"} 
                onClick={handleLike}
                className={isLiked ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}
            >
                <ThumbsUp className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {likesCount}
            </Button>
            <Button variant={isFollowing ? "secondary" : "outline"} onClick={handleFollow}>
                {isFollowing ? "Following" : "Follow"}
            </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
            {report.photo_url && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                    <Image src={report.photo_url} alt={report.title} fill className="object-cover" />
                </div>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{report.description}</p>
                    {report.location && (report.location as any).address && (
                        <div className="mt-4 flex items-center text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            <MapPin className="mr-2 h-4 w-4" />
                            {(report.location as any).address}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Community Updates 
                    <Badge variant="secondary">{updates.length}</Badge>
                </h3>
                
                {currentUser && (
                    <Card>
                        <CardContent className="pt-4">
                            <Textarea 
                                placeholder="Add an update or comment..." 
                                value={newUpdate}
                                onChange={(e) => setNewUpdate(e.target.value)}
                                className="mb-2"
                            />
                            <Button size="sm" onClick={handleSubmitUpdate} disabled={isSubmittingUpdate || !newUpdate.trim()}>
                                {isSubmittingUpdate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post Update
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {updates.map((update: any) => (
                        <Card key={update.id}>
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={update.profiles?.avatar_url} />
                                        <AvatarFallback>{update.profiles?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{update.profiles?.name}</p>
                                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-sm text-foreground">{update.content}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            {statusSteps.map((step, index) => (
                                <div key={step} className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${index <= currentStepIndex ? "bg-primary" : "bg-muted"}`} />
                                    <span className={`text-sm capitalize ${index === currentStepIndex ? "font-bold" : "text-muted-foreground"}`}>
                                        {step.replace("_", " ")}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        {report.status !== "closed" && (
                            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Is this fixed?</span>
                                    <Badge variant={hasConfirmed ? "success" : "secondary"}>
                                        {confirmations}/3 Confirmed
                                    </Badge>
                                </div>
                                <Button 
                                    className="w-full" 
                                    size="sm" 
                                    variant={hasConfirmed ? "outline" : "default"}
                                    onClick={handleConfirm}
                                    disabled={hasConfirmed || isConfirming || !currentUser}
                                >
                                    {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {hasConfirmed ? "Confirmed" : "Confirm Fix"}
                                </Button>
                                {!currentUser && <p className="text-xs text-center text-muted-foreground">Login to confirm</p>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-sm">Reporter</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={report.profiles?.avatar_url} />
                            <AvatarFallback>{report.profiles?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm">{report.profiles?.name || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground">Joined {report.profiles?.created_at ? new Date(report.profiles.created_at).getFullYear() : "recently"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
