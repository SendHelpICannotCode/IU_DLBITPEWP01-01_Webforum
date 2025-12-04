"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Version {
  version: number;
  content: string;
  title?: string;
  createdAt: Date;
}

interface VersionNavigatorProps {
  currentVersion: number;
  versions: Version[];
  onVersionChange: (version: number, content: string, title?: string) => void;
  className?: string;
}

export function VersionNavigator({
  currentVersion,
  versions,
  onVersionChange,
  className,
}: VersionNavigatorProps) {
  const [selectedVersion, setSelectedVersion] = useState(currentVersion);

  // Wenn nur Version 1 und keine älteren Versionen, ist nichts bearbeitet
  const hasHistory = versions.length > 0;
  const isViewingHistory = selectedVersion < currentVersion;

  function handlePrevious() {
    if (selectedVersion > 1) {
      const newVersion = selectedVersion - 1;
      setSelectedVersion(newVersion);

      // Version aus der History holen
      const historyVersion = versions.find((v) => v.version === newVersion);
      if (historyVersion) {
        onVersionChange(
          newVersion,
          historyVersion.content,
          historyVersion.title
        );
      }
    }
  }

  function handleNext() {
    if (selectedVersion < currentVersion) {
      const newVersion = selectedVersion + 1;
      setSelectedVersion(newVersion);

      if (newVersion === currentVersion) {
        // Zurück zur aktuellen Version - Signal zum Zurücksetzen
        onVersionChange(newVersion, "", "");
      } else {
        // Eine ältere Version
        const historyVersion = versions.find((v) => v.version === newVersion);
        if (historyVersion) {
          onVersionChange(
            newVersion,
            historyVersion.content,
            historyVersion.title
          );
        }
      }
    }
  }

  function handleReset() {
    setSelectedVersion(currentVersion);
    onVersionChange(currentVersion, "", "");
  }

  // Keine Bearbeitung - ausgegraut anzeigen
  if (!hasHistory) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs text-slate-600 select-none",
          className
        )}
      >
        <History className="h-3 w-3" />
        <span className="tabular-nums">v{currentVersion}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Zurück zur aktuellen Version Button */}
      {isViewingHistory && (
        <button
          onClick={handleReset}
          className="mr-2 px-2 py-0.5 text-[10px] rounded bg-cyan-900/50 text-cyan-400 hover:bg-cyan-900/70 transition-colors"
        >
          Zur aktuellen Version
        </button>
      )}

      {/* Previous Button - Ältere Versionen */}
      <button
        onClick={handlePrevious}
        disabled={selectedVersion <= 1}
        className={cn(
          "p-0.5 rounded transition-colors",
          selectedVersion > 1
            ? "text-slate-400 hover:text-white hover:bg-slate-800"
            : "text-slate-700 cursor-not-allowed"
        )}
        title="Ältere Version anzeigen"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Version Info */}
      <span
        className={cn(
          "text-xs min-w-[4ch] text-center",
          isViewingHistory ? "text-amber-400" : "text-slate-400"
        )}
      >
        {isViewingHistory ? `v${selectedVersion}` : "Aktuell"}
      </span>

      {/* Next Button - Neuere Versionen */}
      <button
        onClick={handleNext}
        disabled={selectedVersion >= currentVersion}
        className={cn(
          "p-0.5 rounded transition-colors",
          selectedVersion < currentVersion
            ? "text-slate-400 hover:text-white hover:bg-slate-800"
            : "text-slate-700 cursor-not-allowed"
        )}
        title="Neuere Version anzeigen"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* History Icon mit Versionsanzahl */}
      <div className="flex items-center gap-1 ml-1 text-[10px]">
        <History
          className={cn(
            "h-3 w-3",
            isViewingHistory ? "text-amber-400" : "text-slate-600"
          )}
        />
        <span className="text-slate-600">{currentVersion}</span>
      </div>
    </div>
  );
}
