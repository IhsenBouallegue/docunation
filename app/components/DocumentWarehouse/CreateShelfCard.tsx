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
          className="relative border p-6 rounded-xl bg-gradient-to-br bg-card hover:bg-accent/10 transition-colors cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          {/* Shelf Label */}
          <div className="flex items-center gap-2 justify-center">
            <Plus className="h-5 w-5 text-slate-600" />
            <BookOpen className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-medium text-slate-600 text-center">Create New Shelf</h2>
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Shelf</DialogTitle>
          <DialogDescription>
            Create a new shelf to organize your documents. Shelves can contain multiple folders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Shelf Name</Label>
            <Input
              id="name"
              placeholder="Enter shelf name..."
              value={shelfName}
              onChange={(e) => setShelfName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createShelf(shelfName.trim())}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => createShelf(shelfName.trim())} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
