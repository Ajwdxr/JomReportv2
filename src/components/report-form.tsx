"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin, Upload, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

const categories = ["Roads", "Lighting", "Waste", "Safety", "Other"] as const

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().optional(),
  category: z.enum(categories),
  location: z.string().optional(),
})

export function ReportForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Other",
      location: "",
    },
  })

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          setLocationCoords({ lat, lng })

          try {
             // Call our internal API route to handle geocoding server-side (avoids CORS)
             const response = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`)
             const data = await response.json()
             
             if (data && data.display_name) {
                 form.setValue("location", data.display_name)
                 toast.success("Location address found!")
             } else {
                 form.setValue("location", `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
                 toast.success("Location coordinates found!")
             }
          } catch (error) {
             console.error("Geocoding error:", error)
             form.setValue("location", `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
             toast.success("Location coordinates found (Address lookup failed)")
          } finally {
             setIsLoading(false)
          }
        },
        (error) => {
          console.error("Geolocation error:", error)
          toast.error("Could not get location. Please allow access or try again.")
          setIsLoading(false)
        },
        { enableHighAccuracy: true }
      )
    } else {
      toast.error("Geolocation is not supported by this browser.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const supabase = createClient()

    let photo_url = null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")

      // Rate Limit Check: 5 reports per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from("reports")
        .select("*", { count: 'exact', head: true })
        .eq("creator_id", user.id)
        .gte("created_at", oneHourAgo)

      if (count !== null && count >= 5) {
        toast.error("Rate limit exceeded (5 reports/hour). Please try again later.")
        setIsLoading(false)
        return
      }

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("reports")
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error("Failed to upload image")
        }

        const { data } = supabase.storage.from("reports").getPublicUrl(filePath)
        photo_url = data.publicUrl
      }

      // Ensure profile exists before creating report
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single()
      
      if (!profile) {
        // If profile is missing (e.g. created before triggers were set up), create it now
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          name: user.user_metadata.full_name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata.avatar_url || null,
        })
        if (profileError) {
             console.error("Error creating profile:", profileError)
             throw new Error("Failed to create user profile")
        }
      }

      const { error: insertError } = await supabase.from("reports").insert({
        title: values.title,
        description: values.description,
        category: values.category,
        location: {
          address: values.location,
          lat: locationCoords?.lat || null,
          lng: locationCoords?.lng || null,
        },
        photo_url,
        creator_id: user.id,
      })

      if (insertError) throw insertError

      toast.success("Report submitted successfully!")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to submit report. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Form Fields */}
            <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief title of the issue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide more details..."
                          className="resize-none h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Enter address or landmark (optional)" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={handleGeolocation} title="Use my current location">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        Click map pin to use GPS location.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            {/* Right Column: Image Preview/Upload */}
            <div className="flex flex-col gap-2">
                <Label>Photo Evidence</Label>
                <div 
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center p-6 h-full min-h-[200px] md:min-h-[300px] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors relative overflow-hidden"
                >
                    <input 
                        id="photo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                    
                    {previewUrl ? (
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="absolute inset-0 w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="text-center space-y-2">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full inline-block">
                                <Upload className="h-8 w-8 text-gray-500" />
                            </div>
                            <div className="text-gray-500 font-medium">Click to upload photo</div>
                            <div className="text-xs text-gray-400">JPG, PNG up to 5MB</div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <Button type="submit" className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Report
        </Button>
      </form>
    </Form>
  )
}
