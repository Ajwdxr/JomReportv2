import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ReportDetail } from "@/components/report-detail"

interface ReportPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: report, error } = await supabase
    .from("reports")
    .select("*, profiles:creator_id(*), updates(*, profiles:user_id(*)), confirmations(count), likes(count)")
    .eq("id", id)
    .single()

  if (error || !report) {
    console.error("Error fetching report:", error)
    notFound()
  }

  // Initial updates sort logic
  if (report.updates) {
    report.updates.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const { data: { user } } = await supabase.auth.getUser()

  let isFollowing = false
  let hasConfirmed = false
  let isLiked = false

  if (user) {
    const { data: follow } = await supabase
      .from("follows")
      .select("report_id")
      .eq("user_id", user.id)
      .eq("report_id", id)
      .maybeSingle()
      
    if (follow) isFollowing = true

      
    if (follow) isFollowing = true

    const { data: confirmation } = await supabase
      .from("confirmations")
      .select("id")
      .eq("user_id", user.id)
      .eq("report_id", id)
      .maybeSingle()

    if (confirmation) hasConfirmed = true

    const { data: like } = await supabase
      .from("likes")
      .select("report_id")
      .eq("user_id", user.id)
      .eq("report_id", id)
      .maybeSingle()
      
    if (like) isLiked = true
  }

  return (
    <ReportDetail 
      report={report} 
      currentUser={user}
      isFollowing={isFollowing}
      hasConfirmed={hasConfirmed}
      isLiked={isLiked}
      likesCount={report.likes?.[0]?.count || 0}
    />
  )
}
