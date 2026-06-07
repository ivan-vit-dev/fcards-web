"use client";

import { useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface PhotoUploadProps {
  userId: string;
  currentPhotoURL?: string;
  displayName?: string;
  onUpload: (url: string) => void;
}

export function PhotoUpload({ userId, currentPhotoURL, displayName, onUpload }: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(currentPhotoURL);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Soubor je příliš velký (max. 5 MB).");
      return;
    }
    setUploading(true);
    try {
      const storageRef = ref(storage, `users/${userId}/photos/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setPreview(url);
      onUpload(url);
    } catch {
      toast.error("Nahrání se nezdařilo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={preview} />
          <AvatarFallback className="text-lg font-display">{initials}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <Camera className="h-3.5 w-3.5" />
        {preview ? "Změnit foto" : "Nahrát foto"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
