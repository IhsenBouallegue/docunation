import ApplicationsList from "./components/ApplicationsList";
import Chat from "./components/Chat";
import FileUpload from "./components/FileUpload";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <main className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <h1 className="text-4xl font-bold text-center">Your Digital Twin</h1>
            <p className="mt-2 text-lg text-muted-foreground text-center max-w-2xl">
              A smart replica of you that understands your documents and handles applications on your behalf
            </p>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - File Upload */}
          <div className="xl:col-span-3 xl:row-span-2">
            <div className="sticky top-8">
              <FileUpload />
            </div>
          </div>

          {/* Center Column - Chat */}
          <div className="xl:col-span-6 xl:row-span-2">
            <div className="sticky top-8">
              <Chat />
            </div>
          </div>

          {/* Right Column - Applications */}
          <div className="xl:col-span-3 xl:row-span-2">
            <div className="sticky top-8">
              <ApplicationsList />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Your Digital Twin learns from your documents to handle applications and paperwork just like you would.</p>
        </div>
      </main>
    </div>
  );
}
