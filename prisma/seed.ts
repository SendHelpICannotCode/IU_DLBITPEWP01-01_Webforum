// code/prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Passwort-Hashing mit bcrypt (Work-Factor 10)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log('Starte Seeding...')

  // Clean Up (Alles löschen, um Duplikate zu vermeiden)
  await prisma.post.deleteMany()
  await prisma.thread.deleteMany()
  await prisma.user.deleteMany()

  // Passwörter hashen (für Seed-Daten: alle haben das Passwort "test1234")
  const testPassword = await hashPassword('test1234')
  const adminPassword = await hashPassword('admin1234')

  // --- Beispiel-USER ERSTELLEN ---

  // Der Server-Admin (Passwort: admin1234)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@forum.local',
      username: 'Admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // Ein Moderator (Passwort: test1234)
  const modUser = await prisma.user.create({
    data: {
      email: 'mod@forum.local',
      username: 'Moderator',
      passwordHash: testPassword,
      role: UserRole.ADMIN, // Hat Admin-Rechte im Forum
    },
  })

  // Die normalen Nutzer (Passwort: test1234)
  const user1 = await prisma.user.create({
    data: {
      email: 'max@example.com',
      username: 'MaxMuster',
      passwordHash: testPassword,
      role: UserRole.USER,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'anna@example.com',
      username: 'AnnaSchmidt',
      passwordHash: testPassword,
      role: UserRole.USER,
    },
  })

  // --- THREADS & POSTS ERSTELLEN ---

  // Thread 1: Willkommen (vom Admin)
  const threadWelcome = await prisma.thread.create({
    data: {
      title: 'Willkommen im Forum!',
      content:
        'Herzlich willkommen in unserem Community-Forum! Hier könnt ihr euch austauschen, Fragen stellen und Diskussionen führen. Bitte beachtet unsere Forenregeln und seid respektvoll zueinander.',
      authorId: admin.id,
    },
  })

  await prisma.post.create({
    data: {
      content: 'Super, dass es endlich losgeht! Freue mich auf den Austausch mit euch allen.',
      authorId: user1.id,
      threadId: threadWelcome.id,
    },
  })

  await prisma.post.create({
    data: {
      content: 'Danke für die Einladung! Das Forum sieht sehr übersichtlich aus.',
      authorId: user2.id,
      threadId: threadWelcome.id,
    },
  })

  // Thread 2: Vorstellungsrunde
  const threadIntro = await prisma.thread.create({
    data: {
      title: 'Stellt euch vor!',
      content:
        'In diesem Thread könnt ihr euch kurz vorstellen. Wer seid ihr, was sind eure Interessen und was erhofft ihr euch von diesem Forum?',
      authorId: modUser.id,
    },
  })

  await prisma.post.create({
    data: {
      content:
        'Hi, ich bin Max! Ich interessiere mich für Webentwicklung und bin hier, um mich mit Gleichgesinnten auszutauschen.',
      authorId: user1.id,
      threadId: threadIntro.id,
    },
  })

  // Thread 3: Technische Frage
  const threadTech = await prisma.thread.create({
    data: {
      title: 'Frage zu TypeScript Generics',
      content:
        'Hat jemand Erfahrung mit TypeScript Generics? Ich versuche gerade, eine typsichere Funktion zu schreiben, aber stoße auf Probleme mit den Constraints.',
      authorId: user2.id,
    },
  })

  await prisma.post.create({
    data: {
      content:
        'Generics sind anfangs etwas knifflig. Kannst du deinen Code-Schnipsel teilen? Dann kann ich dir besser helfen.',
      authorId: user1.id,
      threadId: threadTech.id,
    },
  })

  await prisma.post.create({
    data: {
      content:
        'Schau dir mal die offizielle TypeScript-Dokumentation an, die hat gute Beispiele zu Generics mit Constraints.',
      authorId: modUser.id,
      threadId: threadTech.id,
    },
  })

  console.log('✅ Datenbank erfolgreich mit Test-Daten befüllt!')
  console.log('')
  console.log('Test-Zugänge:')
  console.log('  Admin:     admin@forum.local / admin1234')
  console.log('  Moderator: mod@forum.local / test1234')
  console.log('  User 1:    max@example.com / test1234')
  console.log('  User 2:    anna@example.com / test1234')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })