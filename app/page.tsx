import { Logo } from "../components/logo";
import { ChatBubble } from "./components/ChatBubble";
import { DocumentWarehouse } from "./components/DocumentWarehouse";
import { Navigation } from "./components/Navigation";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 pb-24">
        {/* App Header */}
        <header className="py-6 mb-6 w-full flex flex-col justify-center items-center">
          <Logo className="mb-2 m-auto" />
          <p className="text-muted-foreground">Your personal document companion</p>
        </header>

        {/* Main Content */}
        <DocumentWarehouse />
      </div>

      {/* Fixed Elements */}
      <Navigation />
      <ChatBubble />
    </main>
  );
}
