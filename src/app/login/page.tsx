import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { EmailLoginForm } from "@/components/auth/email-login-form"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto min-h-screen grid lg:grid-cols-2 bg-white dark:bg-[#0f172a]">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center items-center p-8 relative min-h-full">
        <Link href="/" className="absolute top-8 left-8">
            <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
            </Button>
        </Link>
        <div className="w-full max-w-sm space-y-8">
            <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-[350px] h-[150px] mb-6">
                     <Image src="/jomreport.png" alt="JomReport" fill className="object-contain dark:invert-0" priority />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Selamat Datang
                </h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                    Log masuk untuk mula membuat laporan dan pantau isu komuniti.
                </p>
            </div>

            <div className="space-y-4">
                <GoogleLoginButton />
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-[#0f172a] px-2 text-slate-500 dark:text-gray-400">
                            Atau log masuk dengan email
                        </span>
                    </div>
                </div>

                <EmailLoginForm />

                <div className="text-center text-xs text-slate-500 dark:text-gray-400">
                    Dengan meneruskan, anda bersetuju dengan <a href="#" className="underline hover:text-slate-900 dark:hover:text-white">Terma Perkhidmatan</a> dan <a href="#" className="underline hover:text-slate-900 dark:hover:text-white">Polisi Privasi</a> kami.
                </div>
            </div>
        </div>
      </div>

      {/* Right Column - Image/Decoration */}
      <div className="hidden lg:block relative bg-[#0f172a]">
         <div className="absolute inset-0">
             <Image 
                src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2069&auto=format&fit=crop" 
                alt="Community" 
                fill 
                className="object-cover opacity-50 mix-blend-overlay"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
         </div>
         <div className="relative h-full flex flex-col justify-end p-12 text-white">
            <blockquote className="space-y-2 max-w-lg">
                <p className="text-lg font-medium">
                    &ldquo;Perubahan bermula daripada kita. Mari bersama-sama menjadikan komuniti kita tempat yang lebih baik dan selamat untuk semua.&rdquo;
                </p>
                <footer className="text-sm text-indigo-200 font-semibold">
                    - Team JomReport
                </footer>
            </blockquote>
         </div>
      </div>
    </div>
  )
}
