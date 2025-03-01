import { Suspense } from "react"
import TranslationInterface from "@/components/translation-interface"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen w-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-blue-800">Loading translation interface...</span>
          </div>
        }
      >
        <TranslationInterface />
      </Suspense>
    </main>
  )
}

