"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "./ui";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {user && (
            <>
              <span className="text-sm text-gray-700">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Cerrar Sesion
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
