import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { LoginButton } from "@/components/auth/login-button"
import { Megaphone } from "lucide-react"
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
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
           <Image src="/jomreport.png" alt="JomReport Logo" width={150} height={40} className="h-8 w-auto dark:invert-0" />
        </Link>
        
        <div className="flex items-center gap-4">
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
