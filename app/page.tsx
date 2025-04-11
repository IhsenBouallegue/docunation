import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentWarehouse } from "./components/DocumentWarehouse";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="pb-24">
      {/* Main Content */}
      <DocumentWarehouse />
    </main>
  );
}
