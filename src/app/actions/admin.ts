"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper to check admin role
async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    throw new Error("Unauthorized")
  }
  return supabase
}

export async function updateReportStatus(reportId: string, status: string) {
  const supabase = await checkAdmin()
  
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId)

  if (error) throw error
  revalidatePath("/admin")
  revalidatePath(`/report/${reportId}`)
}

export async function toggleReportVisibility(reportId: string, isHidden: boolean) {
  const supabase = await checkAdmin()
  
  const { error } = await supabase
    .from("reports")
    .update({ is_hidden: isHidden })
    .eq("id", reportId)

  if (error) throw error
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function toggleReportLock(reportId: string, isLocked: boolean) {
  const supabase = await checkAdmin()
  
  const { error } = await supabase
    .from("reports")
    .update({ is_locked: isLocked })
    .eq("id", reportId)

  if (error) throw error
  revalidatePath("/admin")
  revalidatePath(`/report/${reportId}`)
}

export async function banUser(userId: string, isBanned: boolean) {
  const supabase = await checkAdmin()
  
  // Update public profile
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: isBanned })
    .eq("id", userId)

  if (error) throw error
  revalidatePath("/admin")
}
