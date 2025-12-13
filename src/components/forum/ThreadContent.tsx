"use client";

import { useState, useEffect } from "react";
import { VersionNavigator } from "./VersionNavigator";
import { getThreadVersions } from "@/actions/threads";
import { DeleteThreadButton } from "./DeleteThreadButton";
import { ThreadEditor } from "./ThreadEditor";
import { LockThreadButton } from "./LockThreadButton";
import { Pencil } from "lucide-react";

interface ThreadVersion {
  version: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface ThreadContentProps {
  threadId: string;
  title: string;
  content: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  canModerate?: boolean;
  isLocked?: boolean;
  isAdmin?: boolean;
  currentCategories?: Category[];
}

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

export function ThreadContent({
  threadId,
  title,
  content,
  currentVersion,
  createdAt,
  updatedAt,
  canModerate,
  isLocked = false,
  isAdmin = false,
  currentCategories = [],
}: ThreadContentProps) {
  const [versions, setVersions] = useState<ThreadVersion[]>([]);
  const [displayTitle, setDisplayTitle] = useState(title);
  const [displayContent, setDisplayContent] = useState(content);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Versionen laden wenn nötig
  useEffect(() => {
    if (currentVersion > 1) {
      getThreadVersions(threadId).then((v) => {
        setVersions(
          v.map((ver) => ({
            version: ver.version,
            title: ver.title,
            content: ver.content,
            createdAt: ver.createdAt,
          }))
        );
      });
    }
  }, [threadId, currentVersion]);

  // Props aktualisieren, wenn sich title, content oder currentVersion ändern
  // (z.B. nach einer Bearbeitung durch router.refresh())
  useEffect(() => {
    // Wenn gerade eine ältere Version angesehen wird, zurück zur aktuellen Version springen
    // (z.B. wenn eine neue Bearbeitung stattgefunden hat)
    if (isViewingHistory) {
      setIsViewingHistory(false);
    }
    // Immer den Display-State mit den aktuellen Props aktualisieren
    setDisplayTitle(title);
    setDisplayContent(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, currentVersion]);

  function handleVersionChange(
    version: number,
    versionContent: string,
    versionTitle?: string
  ) {
    if (version === currentVersion || !versionContent) {
      // Zurück zur aktuellen Version
      setDisplayTitle(title);
      setDisplayContent(content);
      setIsViewingHistory(false);
    } else {
      setDisplayTitle(versionTitle || title);
      setDisplayContent(versionContent);
      setIsViewingHistory(true);
    }
  }

  const wasEdited = updatedAt.getTime() !== createdAt.getTime();

  return (
    <div>
      {/* Hinweis für bearbeiteten Beitrag */}
      {wasEdited && !isViewingHistory && (
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-slate-800 px-2 py-0.5">
            Bearbeiteter Beitrag
          </span>
        </div>
      )}

      {/* Hinweis für ältere Version */}
      {isViewingHistory && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="rounded bg-amber-900/50 px-2 py-0.5 text-amber-400">
            Ältere Version
          </span>
        </div>
      )}

      {/* Titel */}
      <h1
        className={`text-2xl font-bold text-white mb-4 ${isViewingHistory ? "opacity-70" : ""}`}
      >
        {displayTitle}
      </h1>

      {/* Inhalt */}
      <div
        className={`text-slate-300 whitespace-pre-wrap break-words ${isViewingHistory ? "opacity-70 italic" : ""}`}
      >
        {displayContent}
      </div>

      {/* Footer mit Zeiten und Version Navigator */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
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

      {/* Aktionen (nur wenn berechtigt) */}
      {isEditing ? (
        <ThreadEditor
          threadId={threadId}
          currentTitle={title}
          currentContent={content}
          currentCategories={currentCategories}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        canModerate && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3 flex-wrap">
            {!isLocked && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                Bearbeiten
              </button>
            )}
            {isLocked && !isAdmin && (
              <span className="text-sm text-amber-400">
                Thread ist gesperrt - Bearbeitung nicht möglich
              </span>
            )}
            {isAdmin && (
              <LockThreadButton threadId={threadId} isLocked={isLocked} />
            )}
            <DeleteThreadButton threadId={threadId} />
          </div>
        )
      )}
    </div>
  );
}
