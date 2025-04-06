import { useDebounce } from "@/app/hooks/use-debounce";
import type { Document } from "@/app/types/document";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface DocumentSearchProps {
  onSearch: (filteredDocuments: Document[]) => void;
  documents: Document[];
}

export function DocumentSearch({ onSearch, documents }: DocumentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const query = debouncedSearch.toLowerCase().trim();

    if (!query) {
      onSearch(documents);
      return;
    }

    const filtered = documents.filter((doc) => {
      const searchableContent = [
        doc.name.toLowerCase(),
        doc.folder?.toLowerCase() || "",
        doc.type.toLowerCase(),
        ...(doc.tags || []).map((tag) => tag.toLowerCase()),
      ].join(" ");

      return searchableContent.includes(query);
    });

    onSearch(filtered);
  }, [debouncedSearch, documents, onSearch]);

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search by name, folder, type, or tags..."
        className="pl-9 w-full"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
