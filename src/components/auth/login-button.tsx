"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  return (
    <Link href="/login">
      <Button className="bg-[#6366f1] text-white hover:bg-[#6366f1]/90 dark:bg-white dark:text-black dark:hover:bg-gray-200">
        Log Masuk
      </Button>
    </Link>
  )
}
