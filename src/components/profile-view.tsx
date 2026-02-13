"use client"

import { format } from "date-fns"
import { Trophy, MessageSquare, CheckCircle, Calendar, MapPin, User as UserIcon, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReportCard } from "@/components/report-card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ProfileViewProps {
  profile: any
  reports: any[]
  comments: any[]
  isOwnProfile: boolean
}

const BADGES_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  "First Report": { icon: Trophy, color: "text-yellow-500", label: "First Report" },
  "Helper": { icon: MessageSquare, color: "text-blue-500", label: "Top Helper" },
  "Resolver": { icon: CheckCircle, color: "text-green-500", label: "Issue Resolver" },
}

export function ProfileView({ profile, reports, comments, isOwnProfile }: ProfileViewProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Mock badges if empty for demo (or assume backend handles assignment)
  const badges = profile.badges || []

  // Combine and sort activities
  const activities = [
    ...reports.map(r => ({ ...r, type: 'report', date: new Date(r.created_at) })),
    ...comments.map(c => ({ ...c, type: 'comment', date: new Date(c.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">{profile.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold">{profile.name || "Anonymous User"}</h1>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {profile.created_at ? format(new Date(profile.created_at), "MMM yyyy") : "Recently"}
                </span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  {profile.points} Points
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-4">
                {badges.length > 0 ? (
                    <div className="flex gap-2">
                        {badges.map((badgeName: string) => {
                            const BadgeConfig = BADGES_CONFIG[badgeName]
                            if (!BadgeConfig) return null
                            const Icon = BadgeConfig.icon
                            return (
                                <div key={badgeName} className="flex flex-col items-center gap-1 tooltipped" title={BadgeConfig.label}>
                                    <div className={`p-2 rounded-full bg-muted ${BadgeConfig.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-medium">{badgeName}</span>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground italic">No badges yet</div>
                )}
                
                {isOwnProfile && (
                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
            <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-6">
            {reports.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => (
                        <ReportCard key={report.id} report={{...report, profiles: profile}} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    No reports submitted yet.
                </div>
            )}
        </TabsContent>
        <TabsContent value="activity">
            <div className="space-y-4">
                {activities.length > 0 ? (
                    activities.map((activity: any, index) => (
                        <Card key={`${activity.type}-${activity.id || index}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`p-2 rounded-full ${activity.type === 'report' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                    {activity.type === 'report' ? <MapPin className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        {activity.type === 'report' ? (
                                            <>Mengemukakan laporan: <span className="font-bold">"{activity.title}"</span></>
                                        ) : (
                                            <>Mengulas pada laporan: <span className="font-bold">"{activity.reports?.title || 'Unknown Report'}"</span></>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {format(activity.date, "d MMM yyyy, h:mm a")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        No recent activity.
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
