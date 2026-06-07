"use client";

import { useRef, useState } from "react";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import type { Club } from "@/types";

interface Props {
  club: Club;
  onUpdate: (data: Partial<Club>) => Promise<void>;
}

export function ClubBrandingEditor({ club, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [primaryColor, setPrimaryColor] = useState(
    club.primaryColor ?? "#d97706"
  );
  const [savingColor, setSavingColor] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Soubor musí být obrázek");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo musí být menší než 5 MB");
      return;
    }

    setUploading(true);
    const path = `clubs/${club.id}/logo/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, path);
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
    });

    task.on(
      "state_changed",
      (snap) =>
        setUploadProgress(
          Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        ),
      () => {
        toast.error("Upload selhal");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await onUpdate({ logoURL: url });
        toast.success("Logo bylo nahráno");
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    );
  };

  const handleSaveColor = async () => {
    setSavingColor(true);
    try {
      await onUpdate({ primaryColor });
      toast.success("Barva byla uložena");
    } catch {
      toast.error("Nepodařilo se uložit barvu");
    } finally {
      setSavingColor(false);
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      {/* Logo upload */}
      <div className="space-y-3">
        <Label>Logo klubu</Label>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted shrink-0">
            {club.logoURL ? (
              <img
                src={club.logoURL}
                alt="Logo klubu"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground text-center px-1 leading-tight">
                Žádné logo
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? `Nahrávám ${uploadProgress}%…` : "Nahrát logo"}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG — max 5 MB</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Color picker */}
      <div className="space-y-3">
        <Label>Hlavní barva klubu</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-12 rounded cursor-pointer border border-border bg-transparent p-0.5"
          />
          <Input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#d97706"
            className="w-32 font-mono text-sm"
            maxLength={7}
          />
          <div
            className="h-10 w-10 rounded-lg border border-border shadow-sm shrink-0"
            style={{ background: primaryColor }}
          />
        </div>
        <Button size="sm" onClick={handleSaveColor} disabled={savingColor}>
          {savingColor ? "Ukládám…" : "Uložit barvu"}
        </Button>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <Label>Náhled brandingu</Label>
        <div
          className="rounded-xl p-4 flex items-center gap-3 text-white shadow-md"
          style={{ background: primaryColor }}
        >
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
            {club.logoURL ? (
              <img
                src={club.logoURL}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold font-display">
                {club.name[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-display font-bold text-base leading-tight">
              {club.name}
            </p>
            {club.city && (
              <p className="text-sm opacity-75">{club.city}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
