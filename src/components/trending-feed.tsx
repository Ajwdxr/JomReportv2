"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportCard } from "@/components/report-card"
import { Flame, MapPin } from "lucide-react"

const MALAYSIA_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
  "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", 
  "Labuan", "Putrajaya"
]

interface TrendingFeedProps {
  initialReports: any[]
}

export function TrendingFeed({ initialReports }: TrendingFeedProps) {
  const [selectedState, setSelectedState] = useState<string>("all")

  // Calculate engagement score and sort
  const sortedReports = [...initialReports].map(report => {
    const likesCount = report.likes?.[0]?.count || 0
    const commentsCount = report.updates?.[0]?.count || 0
    const score = likesCount + (commentsCount * 2) // Weight comments higher
    return { ...report, engagementScore: score }
  }).sort((a, b) => b.engagementScore - a.engagementScore)

  // Filter based on state selection
  const filteredReports = selectedState === "all" 
    ? sortedReports 
    : sortedReports.filter(report => {
        // Safe check for address existence and state name
        const address = (report.location as any)?.address || ""
        return address.toLowerCase().includes(selectedState.toLowerCase())
      })

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-lg mb-8">
        <div className="flex items-center gap-3 mb-2">
            <Flame className="h-8 w-8 animate-pulse" />
            <h1 className="text-2xl font-bold">Aduan Popular (FYP)</h1>
        </div>
        <p className="text-orange-100 mb-6 max-w-xl">
            Lihat aduan yang sedang hangat diperkatakan dan mendapat perhatian tinggi daripada komuniti.
        </p>
        
        <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl max-w-sm border border-white/20">
            <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="bg-transparent border-none text-white focus:ring-0 focus:ring-offset-0">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-200" />
                        <SelectValue placeholder="Pilih Negeri" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Negeri</SelectItem>
                    {MALAYSIA_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {filteredReports.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report, index) => (
                <div key={report.id} className="relative group">
                    {/* Ranking Badge for Top 3 */}
                    {index < 3 && selectedState === "all" && (
                        <div className="absolute -top-3 -left-3 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 font-bold shadow-lg border-2 border-white text-lg">
                            #{index + 1}
                        </div>
                    )}
                    <ReportCard report={report} />
                </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-muted-foreground">Tiada aduan trending dijumpai untuk kriteria ini.</p>
        </div>
      )}
    </div>
  )
}
