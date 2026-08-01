import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAdmin, type Reel } from "@/lib/admin-store";

export const Route = createFileRoute("/_admin/reels")({
  component: AdminReelsPage,
});

function AdminReelsPage() {
  const { reels, createReel, updateReel, deleteReel } = useAdmin();

  const [title, setTitle] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (err) {
      console.error(err);
      alert("Failed to upload reel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">
        Instagram Reels
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-card p-6 max-w-xl"
      >
        <h2 className="text-xl font-semibold">
          Add New Reel
        </h2>

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

        <div>
          <div className="space-y-2">
  <label className="block text-sm font-medium">
    Preview Video (.mp4)
  </label>

  <label
    htmlFor="video-upload"
    className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-4 transition hover:border-primary hover:bg-muted/40"
  >
    <div>
      <p className="font-medium">
        {videoFile ? videoFile.name : "Choose MP4 video"}
      </p>

      <p className="text-xs text-muted-foreground mt-1">
        Click to browse or drag & drop
      </p>
    </div>

    <div className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
      Browse
    </div>
  </label>

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

  {videoFile && (
    <video
      src={URL.createObjectURL(videoFile)}
      controls
      className="mt-3 w-full rounded-lg border"
    />
  )}
</div>
        </div>

        <button
          disabled={isSubmitting}
          className="rounded bg-primary px-5 py-2 text-white"
        >
          {isSubmitting ? "Uploading..." : "Upload Reel"}
        </button>
      </form>

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

              <div className="flex justify-between">
                <button
                  onClick={() =>
                    updateReel(reel.id, {
                      isActive: !reel.isActive,
                    })
                  }
                  className={`rounded px-2 py-1 text-xs ${
                    reel.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {reel.isActive ? "Active" : "Hidden"}
                </button>

                <button
                  onClick={() => deleteReel(reel.id)}
                  className="text-xs text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}