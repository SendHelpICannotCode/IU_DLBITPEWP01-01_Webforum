import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";

/**
 * Session-Daten Interface
 */
export interface SessionData {
  userId?: string;
  username?: string;
  email?: string;
  role?: UserRole;
  isLoggedIn: boolean;
}

/**
 * Session-Konfiguration für iron-session
 */
const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "forum-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
  },
};

/**
 * Default Session (nicht eingeloggt)
 */
const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * Holt die aktuelle Session
 */
export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return defaultSession;
  }

  return session;
}

/**
 * Erstellt eine neue Session (Login)
 */
export async function createSession(user: {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  session.userId = user.id;
  session.username = user.username;
  session.email = user.email;
  session.role = user.role;
  session.isLoggedIn = true;

  await session.save();
}

/**
 * Zerstört die Session (Logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  session.destroy();
}
