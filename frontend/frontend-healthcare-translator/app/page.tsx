import { Suspense } from "react"
import TranslationInterface from "@/components/translation-interface"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Healthcare Translation</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Real-time medical translation to improve communication between patients and healthcare providers
          </p>
        </header>

        <Suspense
          fallback={
            <div className="flex justify-center items-center h-[600px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-blue-800">Loading translation interface...</span>
            </div>
          }
        >
          <TranslationInterface />
        </Suspense>

        <footer className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Healthcare Translation. All rights reserved.</p>
          <p>Developed by Sebastian Romero</p>
        </footer>
      </div>
    </main>
  )
}

