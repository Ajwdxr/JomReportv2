import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { LoginButton } from "@/components/auth/login-button"
import { Megaphone, Github } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"

export async function Navbar() {
  let user = null
  let supabase = null

  try {
    supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.warn("Supabase client initialization failed (likely due to missing env vars during build):", error)
  }
  
  let points = 0
  if (user && supabase) {
    const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single()
    if (profile) points = profile.points
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#0f172a] backdrop-blur-md border-[#1e293b] text-white duration-300">
      <div className="w-full bg-indigo-600/10 border-b border-indigo-500/10 py-1 flex items-center justify-center gap-2 text-indigo-200/80 px-4">
        <Megaphone className="h-3 w-3 shrink-0" />
        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center">Bersama Membina Komuniti Sejahtera - Laporkan isu hari ini!</span>
      </div>
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
           <Image src="/jomreport.png" alt="JomReport Logo" width={150} height={40} className="h-8 w-auto dark:invert-0" />
        </Link>
        
        <div className="flex items-center gap-3 md:gap-4">
            <Link href="https://github.com/Ajwdxr/JomReportv2" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
            </Link>
            <ModeToggle />
            
            {user ? (
               <div className="flex items-center gap-3">
                   <div className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Utama</Link>
            <Link href="/trending" className="text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-1">
                <span className="text-orange-500">🔥</span> Popular
            </Link>
            <Link href="/about" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Tentang Kami</Link>
        </div>
                   <div className="hidden md:block">
                       <UserMenu user={user} />
                   </div>
               </div>
            ) : (
                <LoginButton />
            )}
        </div>
      </div>
    </header>
  )
}
