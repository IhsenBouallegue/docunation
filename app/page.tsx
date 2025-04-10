import { ChatBubble } from "./components/ChatBubble";
import { DocumentWarehouse } from "./components/DocumentWarehouse";
import { Navigation } from "./components/Navigation";

export default function Home() {
  return (
    <main className="pb-24">
      {/* Main Content */}
      <DocumentWarehouse />
    </main>
  );
}
