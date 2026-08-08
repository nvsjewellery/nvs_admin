import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAdmin, type Reel } from "@/lib/admin-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/reels")({
  component: AdminReelsPage,
});

function AdminReelsPage() {
  const { reels, createReel, updateReel, deleteReel } = useAdmin();

  const [title, setTitle] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instagramUrl || !videoFile) {
      alert("Please enter the Instagram URL and upload a preview video.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createReel(
        {
          title,
          instagramUrl,
        },
        videoFile
      );

      setTitle("");
      setInstagramUrl("");
      setVideoFile(null);

      // Reset file input visually if needed
      const fileInput = document.getElementById(
        "video-upload"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload reel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteReel(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete reel.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Instagram Reels</h1>

      {/* Add Reel Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-card p-6 max-w-xl"
      >
        <h2 className="text-xl font-semibold">Add New Reel</h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium">
            Title
          </label>

          <input
            className="mt-1 w-full rounded border p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Instagram URL */}
        <div>
          <label className="block text-sm font-medium">
            Instagram Reel URL
          </label>

          <input
            type="url"
            required
            className="mt-1 w-full rounded border p-2"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
          />
        </div>

        {/* Video Upload */}
        <div className="space-y-2">
          <label
            htmlFor="video-upload"
            className="block text-sm font-medium"
          >
            Preview Video (.mp4)
          </label>

          <label
            htmlFor="video-upload"
            className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-4 transition hover:border-primary hover:bg-muted/40"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">
                {videoFile ? videoFile.name : "Choose MP4 video"}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Click to browse or drag & drop
              </p>
            </div>

            <div className="ml-4 shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white cursor-pointer hover:opacity-90 transition">
              Browse
            </div>

            <input
              id="video-upload"
              type="file"
              accept="video/mp4"
              required
              className="hidden"
              onChange={(e) =>
                setVideoFile(e.target.files?.[0] ?? null)
              }
            />
          </label>

          {videoFile && (
            <p className="text-xs text-muted-foreground">
              Selected: {videoFile.name}
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`rounded bg-primary px-5 py-2 text-white transition ${
            isSubmitting
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:opacity-90"
          }`}
        >
          {isSubmitting ? "Uploading..." : "Upload Reel"}
        </button>
      </form>

      {/* Reels */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {reels.map((reel: Reel) => (
          <div
            key={reel.id}
            className="overflow-hidden rounded-lg border bg-card"
          >
            <video
              src={reel.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-64 w-full object-cover"
            />

            <div className="space-y-2 p-3">
              <p className="truncate font-medium">
                {reel.title || "Untitled Reel"}
              </p>

              <div className="flex justify-between items-center">
                {/* Active / Hidden */}
                <button
                  type="button"
                  onClick={() =>
                    updateReel(reel.id, {
                      isActive: !reel.isActive,
                    })
                  }
                  className={`rounded px-2 py-1 text-xs cursor-pointer transition ${
                    reel.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {reel.isActive ? "Active" : "Hidden"}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(reel)}
                  className="text-xs text-red-500 cursor-pointer hover:text-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Reel?</DialogTitle>

            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                "{deleteTarget?.title || "Untitled Reel"}"
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
            >
              {isDeleting ? "Deleting..." : "Delete Reel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}