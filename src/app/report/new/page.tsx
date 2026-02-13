import { Metadata } from "next"
import { ReportForm } from "@/components/report-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "New Report",
  description: "Create a new community report.",
}

export default async function NewReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-3xl font-bold">Report an Issue</h1>
        <p className="text-muted-foreground">
          Help us improve the community by reporting problems.
        </p>
      </div>
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <ReportForm />
      </div>
    </div>
  )
}
