import Chat from "./components/Chat";
import FileUpload from "./components/FileUpload";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Document Assistant</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your documents and let our AI assistant help you process and analyze them.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="sticky top-8">
            <FileUpload />
          </div>
          <div className="sticky top-8">
            <Chat />
          </div>
        </div>

        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>Your documents are processed securely and never shared with third parties.</p>
        </footer>
      </div>
    </main>
  );
}
