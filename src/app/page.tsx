import FileUpload from "@/components/FileUpload";
import UploadedFiles from "@/components/UploadedFiles";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <span className="text-sm text-gray-500">File Upload</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dateien hochladen</h2>
          <p className="mt-1 text-sm text-gray-500">
            Laden Sie Ihre Dateien hoch – unterstützte Formate: Bilder, PDFs und mehr.
          </p>
        </div>

        <FileUpload />
        <UploadedFiles />
      </main>
    </div>
  );
}
