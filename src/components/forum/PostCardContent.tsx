"use client";

import { useState, useEffect } from "react";
import { VersionNavigator } from "./VersionNavigator";
import { getPostVersions } from "@/actions/posts";

interface PostVersion {
  version: number;
  content: string;
  createdAt: Date;
}

interface PostCardContentProps {
  postId: string;
  content: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export function PostCardContent({
  postId,
  content,
  currentVersion,
  createdAt,
  updatedAt,
}: PostCardContentProps) {
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [displayContent, setDisplayContent] = useState(content);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // Versionen laden wenn nötig
  useEffect(() => {
    if (currentVersion > 1) {
      getPostVersions(postId).then((v) => {
        setVersions(
          v.map((ver) => ({
            version: ver.version,
            content: ver.content,
            createdAt: ver.createdAt,
          }))
        );
      });
    }
  }, [postId, currentVersion]);

  // Props aktualisieren, wenn sich content oder currentVersion ändern
  // (z.B. nach einer Bearbeitung durch router.refresh())
  useEffect(() => {
    // Wenn gerade eine ältere Version angesehen wird, zurück zur aktuellen Version springen
    // (z.B. wenn eine neue Bearbeitung stattgefunden hat)
    if (isViewingHistory) {
      setIsViewingHistory(false);
    }
    // Immer den Display-State mit den aktuellen Props aktualisieren
    setDisplayContent(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, currentVersion]);

  function handleVersionChange(version: number, versionContent: string) {
    if (version === currentVersion || !versionContent) {
      // Zurück zur aktuellen Version
      setDisplayContent(content);
      setIsViewingHistory(false);
    } else {
      setDisplayContent(versionContent);
      setIsViewingHistory(true);
    }
  }

  const wasEdited = updatedAt.getTime() !== createdAt.getTime();

  return (
    <div>
      {/* Hinweis für bearbeiteten Beitrag */}
      {wasEdited && !isViewingHistory && (
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-slate-800 px-2 py-0.5">
            Bearbeiteter Beitrag
          </span>
        </div>
      )}

      {/* Hinweis für ältere Version */}
      {isViewingHistory && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="rounded bg-amber-900/50 px-2 py-0.5 text-amber-400">
            Ältere Version
          </span>
        </div>
      )}

      {/* Inhalt */}
      <div
        className={`text-slate-300 whitespace-pre-wrap break-words ${isViewingHistory ? "opacity-70 italic" : ""}`}
      >
        {displayContent}
      </div>

      {/* Footer mit Zeiten und Version Navigator */}
      <div className="mt-3 pt-2 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex flex-col gap-0.5">
          <span>
            Erstellt:{" "}
            {createdAt.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {wasEdited && (
            <span className="text-slate-600">
              Bearbeitet:{" "}
              {updatedAt.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <VersionNavigator
          currentVersion={currentVersion}
          versions={versions}
          onVersionChange={handleVersionChange}
        />
      </div>
    </div>
  );
}
