import { createClient } from "@/lib/supabase/server"
import { ReportsFeed } from "@/components/reports-feed"
import { HomeFilters } from "@/components/home-filters"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, Loader2, LayoutGrid } from "lucide-react"

export default async function Home({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("reports")
    .select("*, profiles:creator_id(*), confirmations(count), likes(count), updates(count)")
    .eq("is_hidden", false)

  const status = searchParams?.status || "all"
  const searchQuery = searchParams?.q || ""

  if (status !== "all") {
    query = query.eq("status", status)
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`)
  }

  const { data: reports, error } = await query
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching reports:", error)
    return (
        <div className="p-8 text-center text-red-500">
            <h2 className="font-bold">Error loading feed</h2>
            <p>{error.message}</p>
        </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4 py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          <span className="block text-slate-900 dark:text-white" style={{ color: 'var(--foreground)' }}>Bersama Membina</span>
          <span className="text-[#6366f1]">Komuniti Sejahtera.</span>
        </h1>
        <p className="text-slate-500 dark:text-gray-400 text-lg md:text-xl max-w-[600px]">
          Dari Komuniti, Untuk Komuniti.
        </p>

        {/* Filter Buttons */}
        <HomeFilters />
      </div>

      <ReportsFeed initialReports={reports || []} status={status} searchQuery={searchQuery} />
    </div>
  )
}
