import Link from "next/link";
import { FileText, MessageSquare, Clock } from "lucide-react";
import { formatRelativeTime } from "./utils";

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  _count: {
    posts: number;
  };
}

interface Post {
  id: string;
  content: string;
  createdAt: Date;
  thread: {
    id: string;
    title: string;
  };
}

interface ActivityTimelineProps {
  threads: Thread[];
  posts: Post[];
}

/**
 * ActivityTimeline - Zeigt Aktivitätsverlauf chronologisch
 */
export function ActivityTimeline({ threads, posts }: ActivityTimelineProps) {
  // Kombiniere und sortiere alle Aktivitäten nach Datum
  const activities = [
    ...threads.map((thread) => ({
      type: "thread" as const,
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt,
      threadId: thread.id,
      postCount: thread._count.posts,
    })),
    ...posts.map((post) => ({
      type: "post" as const,
      id: post.id,
      title: post.thread.title,
      content: post.content,
      createdAt: post.createdAt,
      threadId: post.thread.id,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (activities.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">
        Noch keine Aktivitäten
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={`${activity.type}-${activity.id}`}
          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            {activity.type === "thread" ? (
              <FileText className="h-5 w-5 text-cyan-500" />
            ) : (
              <MessageSquare className="h-5 w-5 text-cyan-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/forum/thread/${activity.threadId}${
                    activity.type === "post" ? `#post-${activity.id}` : ""
                  }`}
                  className="block group"
                >
                  <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {activity.type === "thread"
                      ? activity.title
                      : activity.title}
                  </h4>
                  {activity.type === "post" && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {activity.content}
                    </p>
                  )}
                  {activity.type === "thread" && (
                    <p className="text-xs text-slate-400 mt-1">
                      {activity.postCount}{" "}
                      {activity.postCount === 1 ? "Antwort" : "Antworten"}
                    </p>
                  )}
                </Link>
              </div>

              {/* Zeit */}
              <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatRelativeTime(activity.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
