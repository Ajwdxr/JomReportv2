"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  return (
    <Link href="/login">
      <Button variant="outline" className="border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black">
        Masuk
      </Button>
    </Link>
  )
}
