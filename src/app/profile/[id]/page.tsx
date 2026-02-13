import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileView } from "@/components/profile-view"

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !profile) {
    notFound()
  }

  const { data: reports } = await supabase
    .from("reports")
    .select("*, profiles:creator_id(*), confirmations(count), likes(count), updates(count)") // Include profiles to match ReportCard expectation
    .eq("creator_id", id)
    .order("created_at", { ascending: false })

  const { data: comments } = await supabase
    .from("updates")
    .select("*, reports(title)")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === id

  return <ProfileView profile={profile} reports={reports || []} comments={comments || []} isOwnProfile={isOwnProfile} />
}
