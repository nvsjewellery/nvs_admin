import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdmin,
  type Reel,
} from "@/lib/admin-store";

export const Route = createFileRoute("/_admin/reels")({
  component: AdminReelsPage,
});

function AdminReelsPage() {
  const {
    reels,
    createReel,
    updateReel,
    deleteReel,
  } = useAdmin();

  // =====================================================
  // FORM STATE
  // =====================================================

  const [title, setTitle] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // =====================================================
  // UPLOAD STATE
  // =====================================================

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // =====================================================
  // DELETE STATE
  // =====================================================

  const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // =====================================================
  // HANDLE REEL UPLOAD
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!instagramUrl || !videoFile) {
      toast.error(
        "Please enter the Instagram URL and upload a preview video."
      );
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      await createReel(
        {
          title,
          instagramUrl,
        },
        videoFile,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );

      // Reset form
      setTitle("");
      setInstagramUrl("");
      setVideoFile(null);

      // Make sure progress reaches 100
      setUploadProgress(100);

      toast.success("Reel uploaded successfully");

      // Reset progress after showing completion
      setTimeout(() => {
        setUploadProgress(0);
      }, 1500);
    } catch (err) {
      console.error("Failed to upload reel:", err);

      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to upload reel."
      );

      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // HANDLE DELETE
  // =====================================================

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteReel(deleteTarget.id);

      toast.success("Reel deleted successfully");

      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete reel:", err);

      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete reel."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-8 p-6">

      {/* =================================================
          PAGE TITLE
      ================================================= */}

      <div>
        <h1 className="text-3xl font-bold">
          Instagram Reels
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Add and manage Instagram reels.
        </p>
      </div>

      {/* =================================================
          ADD NEW REEL
      ================================================= */}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-lg border bg-card p-6"
      >
        <h2 className="text-xl font-semibold">
          Add New Reel
        </h2>

        {/* TITLE */}

        <div>
          <label
            htmlFor="reel-title"
            className="block text-sm font-medium"
          >
            Title
          </label>

          <input
            id="reel-title"
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            disabled={isSubmitting}
            className="mt-1 w-full rounded-md border bg-background p-2.5 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Enter reel title"
          />
        </div>

        {/* INSTAGRAM URL */}

        <div>
          <label
            htmlFor="instagram-url"
            className="block text-sm font-medium"
          >
            Instagram Reel URL
          </label>

          <input
            id="instagram-url"
            type="url"
            required
            value={instagramUrl}
            onChange={(e) =>
              setInstagramUrl(e.target.value)
            }
            disabled={isSubmitting}
            className="mt-1 w-full rounded-md border bg-background p-2.5 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="https://www.instagram.com/reel/..."
          />
        </div>

        {/* VIDEO UPLOAD */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Preview Video (.mp4)
          </label>

          <label
            htmlFor="video-upload"
            className={`flex items-center justify-between rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-4 transition ${
              isSubmitting
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:border-primary hover:bg-muted/40"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-medium">
                  {videoFile
                    ? videoFile.name
                    : "Choose MP4 video"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Click to browse or drag & drop
                </p>
              </div>
            </div>

            <div className="ml-3 shrink-0 cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
              Browse
            </div>

            <input
              id="video-upload"
              type="file"
              accept="video/mp4"
              required
              disabled={isSubmitting}
              className="hidden"
              onChange={(e) => {
                const file =
                  e.target.files?.[0] ?? null;

                setVideoFile(file);
                setUploadProgress(0);
              }}
            />
          </label>

          {videoFile && !isSubmitting && (
            <p className="mt-2 text-xs text-muted-foreground">
              Selected: {videoFile.name}
            </p>
          )}
        </div>

        {/* =================================================
            UPLOAD PROGRESS
        ================================================= */}

        {isSubmitting && (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                {uploadProgress >= 100 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Upload complete
                  </>
                ) : (
                  "Uploading video..."
                )}
              </div>

              <span className="text-sm font-semibold">
                {uploadProgress}%
              </span>
            </div>

            {/* PROGRESS BAR */}

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{
                  width: `${uploadProgress}%`,
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Please don't close or refresh the page while the video is uploading.
            </p>
          </div>
        )}

        {/* =================================================
            UPLOAD BUTTON
        ================================================= */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

              {uploadProgress >= 100
                ? "Saving Reel..."
                : `Uploading ${uploadProgress}%`}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Reel
            </>
          )}
        </button>
      </form>

      {/* =================================================
          REELS LIST
      ================================================= */}

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Uploaded Reels
        </h2>

        {reels.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
            No reels uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

            {reels.map((reel: Reel) => (
              <div
                key={reel.id}
                className="overflow-hidden rounded-lg border bg-card"
              >

                {/* VIDEO */}

                <video
                  src={reel.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-64 w-full object-cover"
                />

                {/* DETAILS */}

                <div className="space-y-3 p-3">

                  <p className="truncate font-medium">
                    {reel.title || "Untitled Reel"}
                  </p>

                  <div className="flex items-center justify-between gap-2">

                    {/* ACTIVE / HIDDEN */}

                    <button
                      type="button"
                      onClick={() =>
                        updateReel(reel.id, {
                          isActive: !reel.isActive,
                        })
                      }
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition ${
                        reel.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {reel.isActive ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Hidden
                        </>
                      )}
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget(reel)
                      }
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          DELETE CONFIRMATION DIALOG
      ================================================= */}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">

            {/* HEADER */}

            <div className="flex items-start gap-3">

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  Delete Reel?
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.title ||
                      "this reel"}
                  </span>
                  ?
                  <br />
                  This action cannot be undone.
                </p>
              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-6 flex justify-end gap-3">

              {/* CANCEL */}

              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {/* CONFIRM DELETE */}

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}