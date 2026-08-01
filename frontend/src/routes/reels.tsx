import React, { useState } from "react";
import { useAdmin, type Reel } from "@/lib/admin-store"; // Export & import Reel type

export default function AdminReelsPage() {
  const { reels, createReel, updateReel, deleteReel } = useAdmin();
  const [title, setTitle] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instagramUrl || !videoFile) {
      return alert("Please enter the Instagram URL and upload a 5-second video preview.");
    }

    setIsSubmitting(true);
    try {
      await createReel({ title, instagramUrl }, videoFile);
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
      <h1 className="text-2xl font-bold">Manage Instagram Reels</h1>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4 max-w-lg bg-card">
        <h2 className="text-lg font-semibold">Add New Reel</h2>
        
        <div>
          <label className="block text-sm font-medium">Reel Title / Caption (Optional)</label>
          <input
            type="text"
            className="w-full border p-2 rounded mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Royal Gold Necklace Collection"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Instagram Reel Link *</label>
          <input
            type="url"
            required
            placeholder="https://www.instagram.com/reel/..."
            className="w-full border p-2 rounded mt-1"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Upload 5-Second Video Preview (.mp4) *</label>
          <input
            type="file"
            accept="video/mp4"
            required
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Uploading..." : "Add Reel"}
        </button>
      </form>

      {/* Active & Hidden Reels List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reels.map((reel: Reel) => (
          <div key={reel.id} className="border rounded-lg overflow-hidden relative group bg-card">
            <video 
              src={reel.videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-64 object-cover" 
            />
            <div className="p-2 space-y-2">
              <p className="text-sm font-medium truncate">{reel.title || "Untitled Reel"}</p>
              <div className="flex justify-between items-center text-xs">
                <button
                  onClick={() => updateReel(reel.id, { isActive: !reel.isActive })}
                  className={`px-2 py-1 rounded ${
                    reel.isActive 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {reel.isActive ? "Active" : "Hidden"}
                </button>
                <button 
                  onClick={() => deleteReel(reel.id)} 
                  className="text-red-500 hover:underline"
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