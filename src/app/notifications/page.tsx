import { createClient } from "@/lib/supabase/server"
import { NotificationsList } from "@/components/notifications-list"
import { redirect } from "next/navigation"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch notifications
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(`
      id,
      created_at,
      type,
      is_read,
      actor:actor_id(name, avatar_url),
      report:report_id(id, title)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const formattedNotifications = notifications?.map((n: any) => ({
    ...n,
    actor: Array.isArray(n.actor) ? n.actor[0] : n.actor,
    report: Array.isArray(n.report) ? n.report[0] : n.report,
  }))

  if (error) {
    console.error("Error fetching notifications:", error)
    // Handle error (e.g., render empty state or error message)
    // return <div>Error loading notifications</div>
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 md:px-6 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Notifications
      </h1>
      <NotificationsList notifications={formattedNotifications || []} />
    </div>
  )
}
