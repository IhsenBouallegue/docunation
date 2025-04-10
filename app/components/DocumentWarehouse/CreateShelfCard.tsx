"use client";

import { useCreateShelf } from "@/app/hooks/shelves";
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
import { motion } from "framer-motion";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { useState } from "react";

export function CreateShelfCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [shelfName, setShelfName] = useState("");

  const { mutate: createShelf, isPending } = useCreateShelf();
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative border p-4 sm:p-6 rounded-xl bg-gradient-to-br bg-card hover:bg-accent/10 transition-colors cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          {/* Shelf Label */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-center">
            <Plus className="h-4 sm:h-5 w-4 sm:w-5 text-slate-600" />
            <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-slate-600" />
            <h2 className="text-base sm:text-lg font-medium text-slate-600 text-center">Create New Shelf</h2>
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Create New Shelf</DialogTitle>
          <DialogDescription className="text-sm">
            Create a new shelf to organize your documents. Shelves can contain multiple folders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">
              Shelf Name
            </Label>
            <Input
              id="name"
              placeholder="Enter shelf name..."
              value={shelfName}
              onChange={(e) => setShelfName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && shelfName.trim()) {
                  createShelf(shelfName.trim());
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
            onClick={() => createShelf(shelfName.trim())}
            disabled={isPending || !shelfName.trim()}
            className="h-8 sm:h-10 text-sm sm:text-base"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Shelf"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
