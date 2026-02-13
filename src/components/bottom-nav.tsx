"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, UserCircle, Shield, Flame, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function BottomNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch Avatar
      setUserAvatar(user.user_metadata?.avatar_url || null)

      // Fetch Unread Count
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
      
      setUnreadCount(count || 0)
    }

    fetchData()

    // Realtime subscription
    const channel = supabase
      .channel('unread_notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          // Re-fetch count on any change (insert/update)
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (pathname === "/login") return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-lg border-t border-slate-200 dark:border-[#1e293b] px-6 py-2 pb-6 md:pb-2 md:hidden transition-colors duration-300">
      <Link href="/" className="flex flex-col items-center gap-1 group">
        <div className={cn("p-2 rounded-xl transition-all", pathname === "/" ? "text-[#6366f1] bg-indigo-50 dark:bg-transparent" : "text-slate-400 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white")}>
            <Home className="h-6 w-6" />
        </div>
        <span className={cn("text-[10px] font-medium transition-colors", pathname === "/" ? "text-[#6366f1]" : "text-slate-400 dark:text-gray-400")}>UTAMA</span>
      </Link>

      <Link href="/trending" className="flex flex-col items-center gap-1 group">
        <div className={cn("p-2 rounded-xl transition-all", pathname === "/trending" ? "text-orange-500 bg-orange-50 dark:bg-transparent" : "text-slate-400 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white")}>
            <Flame className="h-6 w-6" />
        </div>
        <span className={cn("text-[10px] font-medium transition-colors", pathname === "/trending" ? "text-orange-500" : "text-slate-400 dark:text-gray-400")}>FYP</span>
      </Link>

      <div className="relative -top-5">
         <Link href="/report/new">
            <div className="bg-[#6366f1] p-4 rounded-2xl shadow-[0_8px_16px_rgba(99,102,241,0.4)] transition-transform active:scale-95 border-4 border-white dark:border-[#0f172a]">
               <Plus className="h-8 w-8 text-white" />
            </div>
         </Link>
      </div>

      <Link href="/notifications" className="flex flex-col items-center gap-1 group relative">
        <div className={cn("p-2 rounded-xl transition-all", pathname === "/notifications" ? "text-indigo-500 bg-indigo-50 dark:bg-transparent" : "text-slate-400 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white")}>
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-2 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-[#0f172a]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
        <span className={cn("text-[10px] font-medium transition-colors", pathname === "/notifications" ? "text-indigo-500" : "text-slate-400 dark:text-gray-400")}>NOTIFIKASI</span>
      </Link>

      <Link href="/profile" className="flex flex-col items-center gap-1 group">
        <div className={cn("p-2 rounded-xl transition-all", pathname.startsWith("/profile") ? "text-[#6366f1] bg-indigo-50 dark:bg-transparent" : "text-slate-400 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white")}>
            <Avatar className="h-6 w-6">
                <AvatarImage src={userAvatar || ""} />
                <AvatarFallback className="bg-transparent">
                    <UserCircle className="h-6 w-6" />
                </AvatarFallback>
            </Avatar>
        </div>
        <span className={cn("text-[10px] font-medium transition-colors", pathname.startsWith("/profile") ? "text-[#6366f1]" : "text-slate-400 dark:text-gray-400")}>PROFIL</span>
      </Link>
    </div>
  )
}
