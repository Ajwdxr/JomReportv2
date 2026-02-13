"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, MessageSquare, Bell, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Notification {
  id: string
  created_at: string
  type: "like" | "comment" | "status_change" | "ban"
  is_read: boolean
  actor: {
    name: string
    avatar_url: string
  }
  report: {
    id: string
    title: string
  } | null
}

export function NotificationsList({ notifications: initialNotifications }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const supabase = createClient()

  const markAsRead = async (id: string, is_read: boolean) => {
    if (is_read) return
    // Optimistic Update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)
  }

  return (
    <div className="space-y-4">
        {notifications.length > 0 && notifications.some(n => !n.is_read) && (
            <div className="flex justify-end">
                <button onClick={markAllAsRead} className="text-sm text-indigo-500 hover:text-indigo-600 font-medium">
                    Mark All as Read
                </button>
            </div>
        )}

        {notifications.length > 0 ? (
            <div className="space-y-3">
                {notifications.map((notification) => {
                    if (notification.type === 'ban') {
                        return (
                            <div 
                                key={notification.id} 
                                onClick={() => markAsRead(notification.id, notification.is_read)}
                                className={`block rounded-xl border p-4 transition-all ${!notification.is_read ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-full shrink-0 bg-red-100 text-red-600">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-red-600 text-sm">System Alert</span>
                                        </div>
                                        <p className="font-medium text-sm text-foreground mb-1">
                                            Your account has been banned due to policy violations.
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        )
                    }

                    return (
                        <Link 
                            key={notification.id} 
                            href={notification.report ? `/report/${notification.report.id}` : '#'} 
                            onClick={() => markAsRead(notification.id, notification.is_read)}
                            className={`block rounded-xl border p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${!notification.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900' : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-full shrink-0 ${notification.type === 'like' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                                    {notification.type === 'like' ? <ThumbsUp className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={notification.actor?.avatar_url} />
                                            <AvatarFallback className="text-[10px]">{notification.actor?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm truncate">{notification.actor?.name || "Someone"}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {notification.type === 'like' ? 'liked your report' : 'commented on your report'}
                                        </span>
                                    </div>
                                    <p className="font-medium text-sm truncate text-foreground mb-1">
                                        "{notification.report?.title || 'Unknown Report'}"
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                {!notification.is_read && (
                                    <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2 shrink-0 animate-pulse" />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        ) : (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Bell className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No notifications yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mt-1">
                    When someone likes or comments on your reports, you'll see it here.
                </p>
            </div>
        )}
    </div>
  )
}
