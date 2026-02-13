export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  points: number
  badges: string[] | null
}

export type ReportStatus = "open" | "acknowledged" | "in_progress" | "closed"
export type ReportCategory = "Roads" | "Lighting" | "Waste" | "Safety" | "Other"

export interface Report {
  id: string
  title: string
  description: string | null
  category: ReportCategory
  status: ReportStatus
  photo_url: string | null
  location: any
  created_at: string
  creator_id: string | null
  profiles?: Profile | null
  // When using select('*, confirmations(count)')
  confirmations?: { count: number }[] 
}
