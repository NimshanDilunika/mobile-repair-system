"use client";

import { useState, ChangeEvent } from "react";

interface IntakePhotoUploaderProps {
  onPhotosChange: (photoUrls: string[]) => void;
}

export default function IntakePhotoUploader({ onPhotosChange }: IntakePhotoUploaderProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.urls) {
        const updated = [...photoUrls, ...data.urls];
        setPhotoUrls(updated);
        onPhotosChange(updated);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const updated = photoUrls.filter((_, i) => i !== index);
    setPhotoUrls(updated);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
      <div className="flex justify-between items-center">
        <label className="block text-slate-300 font-semibold text-xs uppercase tracking-wider">
          Intake Condition Photos ({photoUrls.length}/4)
        </label>
        {uploading && <span className="text-[11px] text-blue-400 animate-pulse">Uploading photos...</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {photoUrls.map((url, idx) => (
          <div key={idx} className="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 group">
            <img src={url} alt={`Intake damage ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full p-1 text-[10px] opacity-90 transition"
            >
              ✕
            </button>
          </div>
        ))}

        {photoUrls.length < 4 && (
          <label className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg cursor-pointer bg-slate-900/50 text-slate-400 hover:text-white transition">
            <span className="text-xl">📷</span>
            <span className="text-[10px] mt-1 font-semibold">Attach Photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-[10px] text-slate-500">
        Photograph existing cracked glass, frame dents, or missing screws before accepting custody.
      </p>
    </div>
  );
}