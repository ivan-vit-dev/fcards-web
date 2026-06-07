"use client";

import { useState } from "react";
import { Upload, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIProgressIndicator } from "./AIProgressIndicator";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useAuthStore } from "@/store/authStore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface Props {
  cardId: string;
  onComplete: (imageUrl: string) => void;
}

export function BackgroundRemover({ cardId, onComplete }: Props) {
  const { user } = useAuthStore();
  const { status, imageUrl, isRunning, callFunction } = useAIGeneration();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const storageRef = ref(storage, `users/${user.uid}/photos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const uploadedUrl = await getDownloadURL(storageRef);

      await callFunction("removeBackground", { cardId, imageUrl: uploadedUrl }, cardId);
    } finally {
      setUploading(false);
    }
  };

  if (imageUrl && status === "done") {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden border border-border bg-[url('/checkerboard.png')] bg-repeat">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Background removed" className="w-full max-h-80 object-contain" />
        </div>
        <Button className="w-full" onClick={() => onComplete(imageUrl)}>
          Použít tento obrázek
        </Button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        <AIProgressIndicator status={status} />
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          AI odstraňuje pozadí. Může to trvat 30–60 sekund.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full max-h-60 object-contain" />
        </div>
      )}

      <label className={`
        flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer
        hover:border-primary/60 hover:bg-primary/5 transition-colors
        ${uploading ? "opacity-50 pointer-events-none" : ""}
      `}>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          {preview ? (
            <ImageOff className="h-5 w-5 text-primary" />
          ) : (
            <Upload className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {preview ? "Nahrát jiný obrázek" : "Nahrát fotografii"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG do 10 MB</p>
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>

      {uploading && (
        <p className="text-xs text-center text-muted-foreground">Nahrávám obrázek…</p>
      )}
    </div>
  );
}
