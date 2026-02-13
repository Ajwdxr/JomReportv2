import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Admin Dashboard | JomReport",
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 mb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage reports, users, and content moderation.</p>
        </div>
        <Badge variant="outline" className="h-fit py-1 px-3 border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-950/30">
            Admin Access
        </Badge>
      </div>

      <AdminDashboard />
    </div>
  )
}
