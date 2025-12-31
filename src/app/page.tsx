import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Blueprint OS</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Sistema operativo para la creacion metodica de SaaS/Apps con AI
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Iniciar Sesion</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Crear Cuenta</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
