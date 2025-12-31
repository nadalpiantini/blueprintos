export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Blueprint OS</h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema operativo para la creación metódica de SaaS/Apps con AI
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Iniciar Sesión
          </a>
          <a
            href="/register"
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Registrarse
          </a>
        </div>
      </div>
    </main>
  );
}
