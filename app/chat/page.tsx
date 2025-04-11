import Chat from "@/app/components/Chat";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }
  return (
    <main className="container mx-auto h-[calc(100vh-theme(spacing.32))] pb-24">
      <Chat />
    </main>
  );
}
