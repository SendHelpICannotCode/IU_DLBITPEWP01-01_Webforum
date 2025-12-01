// code/prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starte Seeding...')

  // Clean Up (Alles löschen, um Duplikate zu vermeiden)
  await prisma.post.deleteMany()
  await prisma.thread.deleteMany()
  await prisma.user.deleteMany()

  // --- Beispiel-USER ERSTELLEN ---

  // Der Server-Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ts-hub.community',
      username: 'System_Root',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$synthetic_hash_value',
      role: UserRole.ADMIN,
    },
  })

  // Ein Moderator
  const modUser = await prisma.user.create({
    data: {
      email: 'mod@ts-hub.community',
      username: 'Tech_Wizard',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$synthetic_hash_value',
      role: UserRole.ADMIN, // Hat Admin-Rechte im Forum
    },
  })

  // Die normalen Nutzer
  const user1 = await prisma.user.create({
    data: {
      email: 'fps@ts-hub.community',
      username: 'Sniper_Elite_99',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$synthetic_hash_value',
      role: UserRole.USER,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'rpg@ts-hub.community',
      username: 'DragonSlayer',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$synthetic_hash_value',
      role: UserRole.USER,
    },
  })

  // --- THREADS & POSTS ERSTELLEN ---

  // Eine Offizielle Ankündigung (vom Admin)
  const threadNews = await prisma.thread.create({
    data: {
      title: '📢 WICHTIG: Server-Wartungsarbeiten am Freitag',
      content: 'Hallo Community, am kommenden Freitag ab 03:00 Uhr wird unser TeamSpeak-Server neugestartet. Wir spielen Sicherheitsupdates ein. Downtime ca. 15 Minuten.',
      authorId: admin.id,
    },
  })

  await prisma.post.create({
    data: {
      content: 'Alles klar, danke für die Info! Hoffentlich ist der Packet Loss danach weg.',
      authorId: user1.id,
      threadId: threadNews.id,
    },
  })

  // Thread 2: LFG (Looking for Group) - Gamer sucht Mitspieler
  const threadLFG = await prisma.thread.create({
    data: {
      title: 'Suche Squad für Counter-Strike 2',
      content: 'Moin, suche noch 2 Mates für eine Runde heute Abend. Sind aktuell im Channel "Lobby 1". Einfach dazukommen!',
      authorId: user1.id,
    },
  })

  await prisma.post.create({
    data: {
      content: 'Wäre dabei, komme gleich online.',
      authorId: user2.id,
      threadId: threadLFG.id,
    },
  })

  // Thread 3: Tech-Support / Hardware
  const threadTech = await prisma.thread.create({
    data: {
      title: '[Hilfe] Mikrofon wird in TS nicht erkannt',
      content: 'Hab mir das neue Rode geholt, aber TeamSpeak zeigt mir keinen Pegel an. In Discord geht es. Hat jemand eine Idee?',
      authorId: user2.id,
    },
  })

  await prisma.post.create({
    data: {
      content: 'Bei mir liegt es manchmal am Audio-Interface, falls du auch eins hast, lohnt sich eventuell ein Aus- und Einstecken. Windows 11 macht da gerne komische Dinge.',
      authorId: modUser.id,
      threadId: threadTech.id,
    },
  })
  
  await prisma.post.create({
    data: {
      content: 'Oha, hat geholfen! Danke dir Tech_Wizard. Endlich hört man mich wieder.',
      authorId: user2.id,
      threadId: threadTech.id,
    },
  })

  console.log('Datenbank ist nun mit Test-Daten befüllt')
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