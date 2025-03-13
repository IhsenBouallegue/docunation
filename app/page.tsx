import Chat from "./components/Chat";
import FileUpload from "./components/FileUpload";

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <div className="flex flex-col items-center gap-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Document Processing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Upload your documents and let our AI process them into markdown format. Then chat with your documents to get
            insights.
          </p>
        </div>

        <div className="w-full grid gap-8">
          <FileUpload />
          <Chat />
        </div>
      </div>
    </main>
  );
}
