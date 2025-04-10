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
        <div className="w-full border border-dashed border-slate-400 rounded-lg bg-white p-4 sm:p-8 flex flex-col items-center justify-center gap-1.5 sm:gap-2 group-hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
          <Plus className="h-6 sm:h-8 w-6 sm:w-8 text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span className="text-xs sm:text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
            Add folder
          </span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Create New Folder</DialogTitle>
          <DialogDescription className="text-sm">
            Create a new folder to organize your documents within this shelf.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">
              Folder Name
            </Label>
            <Input
              id="name"
              placeholder="Enter folder name..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && folderName.trim()) {
                  createFolder({ name: folderName.trim(), shelfId: shelfId });
                }
              }}
              className="h-8 sm:h-10 text-sm sm:text-base"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="h-8 sm:h-10 text-sm sm:text-base">
            Cancel
          </Button>
          <Button
            onClick={() => createFolder({ name: folderName.trim(), shelfId: shelfId })}
            disabled={isPending || !folderName.trim()}
            className="h-8 sm:h-10 text-sm sm:text-base"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin" />
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
