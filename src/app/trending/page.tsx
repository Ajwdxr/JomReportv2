import { createClient } from "@/lib/supabase/server"
import { TrendingFeed } from "@/components/trending-feed"

export default async function TrendingPage() {
  const supabase = await createClient()

  // Fetch verified reports with engagement metrics
  const { data: reports, error } = await supabase
    .from("reports")
    .select("*, profiles:creator_id(*), confirmations(count), likes(count), updates(count)")
    .neq("status", "closed") // Only show active issues? Or include closed for 'success stories'? Let's keep all non-archived?
    // Actually trending can be closed too (success stories).
    .limit(50) // Limit to top 50 recent to calc trending from

  if (error) {
    console.error("Error fetching trending reports:", error)
    return <div>Error loading trending feed</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 mb-20">
      <TrendingFeed initialReports={reports || []} />
    </div>
  )
}
