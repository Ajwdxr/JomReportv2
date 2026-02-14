import { createClient } from "@/lib/supabase/server"
import { ReportsFeed } from "@/components/reports-feed"
import { HomeFilters } from "@/components/home-filters"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; category?: string }>
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("reports")
    .select("*, profiles:creator_id(*), confirmations(count), likes(count), updates(count)")
    .eq("is_hidden", false)

  const { status = "all", q: searchQuery = "", category = "all" } = await searchParams

  if (status !== "all") {
    query = query.eq("status", status)
  }

  if (category !== "all") {
    query = query.eq("category", category)
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
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
    <div className="space-y-6 pb-20">
      {/* Hero Section */}
      <div className="relative flex flex-col items-center text-center space-y-6 pt-8 pb-4 md:pt-12 md:pb-6 px-4">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            <span className="block text-foreground">Bersama Membina</span>
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Komuniti Sejahtera.</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg md:text-xl max-w-[500px] mx-auto">
            Dari Komuniti, Untuk Komuniti.
          </p>
        </div>

        {/* Filters */}
        <HomeFilters />
      </div>

      <ReportsFeed initialReports={reports || []} status={status} searchQuery={searchQuery} />
    </div>
  )
}
