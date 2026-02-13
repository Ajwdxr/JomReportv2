"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ReportCard } from "@/components/report-card"
import { useInView } from "react-intersection-observer"
import { Loader2 } from "lucide-react"

interface ReportsFeedProps {
  initialReports: any[]
  status?: string
  searchQuery?: string
}

export function ReportsFeed({ initialReports, status = "all", searchQuery = "" }: ReportsFeedProps) {
  const [reports, setReports] = useState(initialReports)
  const [offset, setOffset] = useState(initialReports.length)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialReports.length >= 10)
  const { ref, inView } = useInView()
  const supabase = createClient()

  useEffect(() => {
    setReports(initialReports)
    setOffset(initialReports.length)
    setHasMore(initialReports.length >= 10)
    setLoading(false)
  }, [initialReports, status, searchQuery])

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore()
    }
  }, [inView, hasMore, loading])

  const loadMore = async () => {
    setLoading(true)
    let query = supabase
      .from("reports")
      .select("*, profiles:creator_id(*), confirmations(count), likes(count), updates(count)")
      .eq("is_hidden", false)
    
    if (status && status !== "all") {
        query = query.eq("status", status)
    }

    if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`)
    }

    const { data } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + 9)

    if (data && data.length > 0) {
      setReports((prev) => {
        const newReports = data.filter(r => !prev.some(p => p.id === r.id))
        return [...prev, ...newReports]
      })
      setOffset((prev) => prev + data.length)
      if (data.length < 10) setHasMore(false)
    } else {
      setHasMore(false)
    }
    setLoading(false)
  }

  // Realtime subscription for new reports (Optional: might be tricky with filters)
  useEffect(() => {
    const channel = supabase
      .channel("reports-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          // Fetch full report data including profile
          supabase
            .from("reports")
            .select("*, profiles:creator_id(*), confirmations(count)")
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                // Only add if it matches current filters roughly (client side check)
                if (status !== "all" && data.status !== status) return;
                if (searchQuery && !data.title.toLowerCase().includes(searchQuery.toLowerCase())) return;

                setReports((prev) => [data, ...prev])
                setOffset((prev) => prev + 1)
              }
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, status, searchQuery])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
      <div ref={ref} className="col-span-full flex justify-center py-6">
        {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        {!hasMore && reports.length > 0 && (
          <p className="text-muted-foreground text-sm">No more reports</p>
        )}
        {!loading && reports.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full text-center py-10">
                No reports found matching your criteria.
            </p>
        )}
      </div>
    </div>
  )
}
