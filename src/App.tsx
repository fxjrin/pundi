import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold">Pundi</h1>
        <p className="text-muted-foreground">Scaffold OK. Routing lands in Phase 3.</p>
        <Button>shadcn button works</Button>
      </div>
    </div>
  )
}

export default App
