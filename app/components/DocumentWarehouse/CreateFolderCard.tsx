import { useCreateFolder } from "@/app/hooks/folders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function CreateFolderCard({ shelfId }: { shelfId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const { mutate: createFolder, isPending, isSuccess } = useCreateFolder();

  useEffect(() => {
    if (isSuccess) {
      setIsOpen(false);
    }
  }, [isSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="w-full border border-dashed border-slate-400  rounded-lg bg-white p-8 flex flex-col items-center justify-center gap-2 group-hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
          <Plus className="h-8 w-8 text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
            Add folder
          </span>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name</Label>
            <Input
              id="name"
              placeholder="Enter folder name..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder({ name: folderName.trim(), shelfId: shelfId })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => createFolder({ name: folderName.trim(), shelfId: shelfId })} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Folder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
