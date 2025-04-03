import { ChatBubble } from "./components/ChatBubble";
import { DocumentWarehouse } from "./components/DocumentWarehouse";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <DocumentWarehouse />
      <ChatBubble />
    </main>
  );
}
