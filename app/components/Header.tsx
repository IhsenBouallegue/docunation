"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";

export function Header() {
  const { data } = authClient.useSession();
  const user = data?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center m-auto">
        <div className="flex flex-1 items-center justify-between space-x-2">
          <Logo className="h-14 w-24" />

          <div className="flex items-center space-x-4">
            {user ? (
              <UserAvatar />
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
