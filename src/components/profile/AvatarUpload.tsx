"use client";

import { useState, useRef, FormEvent } from "react";
import { useActionState } from "react";
import { Upload, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui";
import {
  uploadAvatar,
  removeAvatar,
  type ActionResult,
} from "@/actions/profile";
import Image from "next/image";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  username: string;
}

/**
 * AvatarUpload - Komponente zum Hochladen und Entfernen von Avataren
 */
export function AvatarUpload({
  currentAvatarUrl,
  userId,
  username,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, uploadAction, isUploading] = useActionState<
    ActionResult | null,
    FormData
  >(uploadAvatar.bind(null, userId), null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith("image/")) {
      alert("Nur Bilddateien sind erlaubt");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Datei darf maximal 2MB groß sein");
      return;
    }

    // Vorschau erstellen
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleRemove() {
    if (!confirm("Avatar wirklich entfernen?")) {
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeAvatar(userId);
      if (result.success) {
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        alert(result.error || "Fehler beim Entfernen des Avatars");
      }
    } catch (error) {
      console.error("Fehler beim Entfernen des Avatars:", error);
      alert("Ein Fehler ist aufgetreten");
    } finally {
      setIsRemoving(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    uploadAction(formData);
  }

  const displayAvatar = preview || currentAvatarUrl;

  return (
    <div className="space-y-4">
      {/* Aktueller Avatar / Vorschau */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {displayAvatar ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800">
              <Image
                src={displayAvatar}
                alt={`${username} Avatar`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
              <User className="h-16 w-16 text-slate-600" />
            </div>
          )}
        </div>

        {/* Upload-Formular */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {preview ? "Anderes Bild wählen" : "Avatar hochladen"}
          </label>

          {preview && (
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isUploading}
                isLoading={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Hochladen
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {uploadState?.error && (
            <p className="text-sm text-red-400">{uploadState.error}</p>
          )}
        </form>

        {/* Avatar entfernen (nur wenn vorhanden) */}
        {currentAvatarUrl && !preview && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            isLoading={isRemoving}
          >
            <X className="mr-2 h-4 w-4" />
            Avatar entfernen
          </Button>
        )}
      </div>

      {/* Hinweise */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>• Erlaubte Formate: JPEG, PNG</p>
        <p>• Maximale Größe: 2MB</p>
        <p>• Empfohlene Größe: 200x200px oder größer</p>
      </div>
    </div>
  );
}
