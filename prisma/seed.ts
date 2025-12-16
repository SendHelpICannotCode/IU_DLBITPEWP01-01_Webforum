// code/prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { faker } from '@faker-js/faker'

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
  await prisma.threadCategory.deleteMany()
  await prisma.thread.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // Passwörter hashen (für Seed-Daten: alle haben das Passwort "test1234")
  const testPassword = await hashPassword('test1234')
  const adminPassword = await hashPassword('admin1234')

  // --- KATEGORIEN ERSTELLEN ---
  const categoryAllgemein = await prisma.category.create({
    data: {
      name: 'Allgemeines',
      description: 'Allgemeine Diskussionen und Themen',
      color: '#3b82f6', // Blau
      keywords: ['allgemein', 'diskussion', 'chat', 'plaudern'],
    },
  })

  const categoryTechnik = await prisma.category.create({
    data: {
      name: 'Technik',
      description: 'Technische Fragen und Diskussionen',
      color: '#10b981', // Grün
      keywords: ['technik', 'code', 'programmierung', 'software', 'entwicklung'],
    },
  })

  const categoryOffTopic = await prisma.category.create({
    data: {
      name: 'Off-Topic',
      description: 'Alles was nicht in andere Kategorien passt',
      color: '#f59e0b', // Orange
      keywords: ['offtopic', 'spaß', 'unterhaltung', 'random'],
    },
  })

  const categories = [categoryAllgemein, categoryTechnik, categoryOffTopic]

  // --- 30 USER ERSTELLEN ---
  console.log('Erstelle 30 User...')

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@forum.local',
      username: 'Admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // 29 normale User
  const users: Array<{
    id: string
    username: string
    email: string
    isBanned: boolean
    isDeleted: boolean
  }> = []

  // Erstelle 29 normale User
  for (let i = 0; i < 29; i++) {
    const username = faker.internet.username()
    const email = faker.internet.email({ provider: 'example.com' })
    
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: testPassword,
        role: UserRole.USER,
      },
    })

    users.push({
      id: user.id,
      username: user.username,
      email: user.email,
      isBanned: false,
      isDeleted: false,
    })
  }

  // 2-3 User sperren (isBanned = true)
  const bannedUsers: string[] = []
  for (let i = 0; i < 3; i++) {
    const userToBan = users[i]
    bannedUsers.push(userToBan.id)
    
    await prisma.user.update({
      where: { id: userToBan.id },
      data: {
        isBanned: true,
        bannedUntil: faker.date.future(),
        banReason: faker.helpers.arrayElement([
          'Verstoß gegen Forenregeln',
          'Spam-Verhalten',
          'Unangemessene Inhalte',
        ]),
        bannedBy: admin.id,
      },
    })
    users[i].isBanned = true
  }

  // 2-3 User löschen (isDeleted = true)
  const deletedUsers: string[] = []
  for (let i = 3; i < 6; i++) {
    const userToDelete = users[i]
    deletedUsers.push(userToDelete.id)
    
    await prisma.user.update({
      where: { id: userToDelete.id },
      data: {
        isDeleted: true,
        deletedAt: faker.date.past(),
        deletedBy: admin.id,
      },
    })
    users[i].isDeleted = true
  }

  const allUsers = [admin, ...users.map(u => ({ id: u.id, username: u.username, email: u.email }))]
  const bannedOrDeletedUserIds = [...bannedUsers, ...deletedUsers]
  const bannedOrDeletedUsers = allUsers.filter(u => bannedOrDeletedUserIds.includes(u.id))

  // --- 47 THREADS ERSTELLEN ---
  console.log('Erstelle 47 Threads...')

  const threads: Array<{ id: string; title: string; authorId: string }> = []
  const threadPostCounts: number[] = []

  // Verteilung der Posts über Threads:
  // 3 Hot Topics: 40, 35, 30 Posts = 105 Posts
  // 10 mittlere Threads: 10-20 Posts = ~150 Posts
  // 34 kleine Threads: 1-5 Posts = ~100 Posts
  // Gesamt: ~355 Posts, aber wir wollen 500, also passen wir an

  // 3 Hot Topics (40, 35, 30 Posts)
  threadPostCounts.push(40, 35, 30)

  // 10 mittlere Threads (10-20 Posts)
  for (let i = 0; i < 10; i++) {
    threadPostCounts.push(faker.number.int({ min: 10, max: 20 }))
  }

  // 34 kleine Threads (1-5 Posts)
  for (let i = 0; i < 34; i++) {
    threadPostCounts.push(faker.number.int({ min: 1, max: 5 }))
  }

  // Gesamt: 3 + 10 + 34 = 47 Threads
  // Berechne die tatsächliche Anzahl der Antwort-Posts (ohne Thread-Erstposts)
  // Jeder Thread hat einen Erstpost, also: Antwort-Posts = threadPostCounts[i] - 1
  const totalPlannedReplyPosts = threadPostCounts.reduce((sum, count) => sum + (count - 1), 0)
  const adjustment = 500 - totalPlannedReplyPosts

  // Passe die Hot Topics an, um genau 500 Antwort-Posts zu erreichen
  if (adjustment !== 0) {
    threadPostCounts[0] += adjustment
  }

  // Erstelle Threads
  // Stelle sicher, dass gesperrte/gelöschte User mindestens einen Thread haben
  // Verteile gesperrte/gelöschte User auf die ersten Threads
  const usedBannedOrDeletedUsers = new Set<string>()
  
  for (let i = 0; i < 47; i++) {
    let author: typeof allUsers[0]
    
    // Stelle sicher, dass alle gesperrten/gelöschten User mindestens einen Thread haben
    if (i < bannedOrDeletedUsers.length && !usedBannedOrDeletedUsers.has(bannedOrDeletedUsers[i].id)) {
      author = bannedOrDeletedUsers[i]
      usedBannedOrDeletedUsers.add(author.id)
    } else {
      // Wähle zufälligen Autor
      author = faker.helpers.arrayElement(allUsers)
    }
    
    // Wähle zufällige Kategorien (1-2)
    const categoryCount = faker.number.int({ min: 1, max: 2 })
    const selectedCategories = faker.helpers.arrayElements(categories, categoryCount)

    const title = faker.lorem.sentence({ min: 4, max: 8 })
    const content = faker.lorem.paragraphs({ min: 2, max: 4 })

    const thread = await prisma.thread.create({
      data: {
        title,
        content,
        authorId: author.id,
        categories: {
          create: selectedCategories.map(cat => ({ categoryId: cat.id })),
        },
      },
    })

    threads.push({ id: thread.id, title: thread.title, authorId: author.id })
  }

  // 2 Threads sperren
  console.log('Sperre 2 Threads...')
  const threadsToLock = threads.slice(0, 2)
  for (const thread of threadsToLock) {
    await prisma.thread.update({
      where: { id: thread.id },
      data: {
        isLocked: true,
        lockedAt: faker.date.past(),
        lockedBy: admin.id,
      },
    })
  }

  // --- 500 POSTS ERSTELLEN ---
  console.log('Erstelle 500 Posts...')

  const postsToCreate: Array<{ threadId: string; authorId: string }> = []

  // Sammle alle Posts, die erstellt werden sollen
  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i]
    const postCount = threadPostCounts[i]

    // Erster Post ist der Thread-Ersteller (wird bereits als Thread-Content gespeichert)
    // Wir erstellen nur Antwort-Posts
    const replyCount = postCount - 1

    for (let j = 0; j < replyCount; j++) {
      // Bevorzuge gesperrte/gelöschte User, damit sie definitiv Posts haben
      // 30% Chance für gesperrte/gelöschte User, 70% für alle anderen
      let author: typeof allUsers[0]
      if (bannedOrDeletedUsers.length > 0 && Math.random() < 0.3) {
        author = faker.helpers.arrayElement(bannedOrDeletedUsers)
      } else {
        author = faker.helpers.arrayElement(allUsers)
      }

      postsToCreate.push({ threadId: thread.id, authorId: author.id })
    }
  }

  // Stelle sicher, dass alle gesperrten/gelöschten User mindestens einen Post haben
  for (const user of bannedOrDeletedUsers) {
    // Prüfe, ob der User bereits Posts geplant hat (außer Thread-Erstposts)
    const userPostsPlanned = postsToCreate.filter(p => p.authorId === user.id).length

    // Wenn der User noch keine Antwort-Posts hat, füge mindestens einen hinzu
    if (userPostsPlanned === 0) {
      const randomThread = faker.helpers.arrayElement(threads)
      postsToCreate.push({ threadId: randomThread.id, authorId: user.id })
    }
  }

  // Passe die Anzahl an, um genau 500 Posts zu erreichen
  // Thread-Erstposts werden nicht als separate Posts gespeichert, nur als Thread-Content
  // Also brauchen wir genau 500 Antwort-Posts
  const targetReplyPosts = 500
  
  // Stelle sicher, dass wir genau die richtige Anzahl haben
  if (postsToCreate.length < targetReplyPosts) {
    // Füge zusätzliche Posts hinzu
    const additional = targetReplyPosts - postsToCreate.length
    for (let i = 0; i < additional; i++) {
      const randomThread = faker.helpers.arrayElement(threads)
      const author = faker.helpers.arrayElement(allUsers)
      postsToCreate.push({ threadId: randomThread.id, authorId: author.id })
    }
  } else if (postsToCreate.length > targetReplyPosts) {
    // Entferne Posts, um genau 500 zu erreichen
    // Entferne vom Ende, nicht vom Anfang, um die Verteilung zu erhalten
    postsToCreate.splice(targetReplyPosts)
  }

  // Erstelle alle Posts
  const createdPosts: Array<{ id: string; threadId: string; authorId: string }> = []
  for (const postData of postsToCreate) {
    const postContent = faker.lorem.paragraphs({ min: 1, max: 3 })

    const post = await prisma.post.create({
      data: {
        content: postContent,
        authorId: postData.authorId,
        threadId: postData.threadId,
      },
    })
    createdPosts.push({ id: post.id, threadId: post.threadId, authorId: post.authorId })
  }

  // Versionshistorie für 20 Threads erstellen (2-6 Versionen, meist 2-3)
  console.log('Erstelle Versionshistorie für 20 Threads...')
  const threadsWithHistory = faker.helpers.arrayElements(threads, Math.min(20, threads.length))
  for (const thread of threadsWithHistory) {
    // Lade aktuellen Thread
    const currentThread = await prisma.thread.findUnique({
      where: { id: thread.id },
    })
    if (!currentThread) continue

    // Bestimme Anzahl der Versionen (2-6, meist 2-3)
    const versionCount = faker.helpers.weightedArrayElement([
      { weight: 0.4, value: 2 }, // 40% haben 2 Versionen
      { weight: 0.4, value: 3 }, // 40% haben 3 Versionen
      { weight: 0.15, value: 4 }, // 15% haben 4 Versionen
      { weight: 0.05, value: 5 }, // 5% haben 5 Versionen
    ])

    // Erstelle Versionen (Version 1 ist bereits vorhanden als currentVersion)
    // Wir erstellen Versionen 1 bis (versionCount-1), da die aktuelle Version die letzte ist
    const originalTitle = currentThread.title
    const originalContent = currentThread.content
    const originalCreatedAt = currentThread.createdAt

    for (let v = 1; v < versionCount; v++) {
      await prisma.threadVersion.create({
        data: {
          threadId: thread.id,
          version: v,
          title: v === 1 ? originalTitle : faker.lorem.sentence({ min: 4, max: 8 }),
          content: v === 1 ? originalContent : faker.lorem.paragraphs({ min: 2, max: 4 }),
          createdAt: new Date(originalCreatedAt.getTime() + v * 3600000), // Stündlich versetzt
        },
      })
    }

    // Aktualisiere currentVersion und updatedAt
    await prisma.thread.update({
      where: { id: thread.id },
      data: {
        currentVersion: versionCount,
        updatedAt: new Date(originalCreatedAt.getTime() + (versionCount - 1) * 3600000),
      },
    })
  }

  // Versionshistorie für 30 Posts erstellen (2-6 Versionen, meist 2-3)
  console.log('Erstelle Versionshistorie für 30 Posts...')
  const postsWithHistory = faker.helpers.arrayElements(
    createdPosts,
    Math.min(30, createdPosts.length)
  )
  for (const post of postsWithHistory) {
    // Lade aktuellen Post
    const currentPost = await prisma.post.findUnique({
      where: { id: post.id },
    })
    if (!currentPost) continue

    // Bestimme Anzahl der Versionen (2-6, meist 2-3)
    const versionCount = faker.helpers.weightedArrayElement([
      { weight: 0.4, value: 2 }, // 40% haben 2 Versionen
      { weight: 0.4, value: 3 }, // 40% haben 3 Versionen
      { weight: 0.15, value: 4 }, // 15% haben 4 Versionen
      { weight: 0.05, value: 5 }, // 5% haben 5 Versionen
    ])

    // Erstelle Versionen (Version 1 ist bereits vorhanden als currentVersion)
    const originalContent = currentPost.content
    const originalCreatedAt = currentPost.createdAt

    for (let v = 1; v < versionCount; v++) {
      await prisma.postVersion.create({
        data: {
          postId: post.id,
          version: v,
          content: v === 1 ? originalContent : faker.lorem.paragraphs({ min: 1, max: 3 }),
          createdAt: new Date(originalCreatedAt.getTime() + v * 3600000), // Stündlich versetzt
        },
      })
    }

    // Aktualisiere currentVersion und updatedAt
    await prisma.post.update({
      where: { id: post.id },
      data: {
        currentVersion: versionCount,
        updatedAt: new Date(originalCreatedAt.getTime() + (versionCount - 1) * 3600000),
      },
    })
  }

  // Finale Statistiken
  const finalThreadCount = await prisma.thread.count()
  const finalPostCount = await prisma.post.count()

  console.log('Datenbank erfolgreich mit Test-Daten befüllt!')
  console.log('')
  console.log(`Statistiken:`)
  console.log(`  User: ${allUsers.length} (1 Admin, ${allUsers.length - 1} normale User)`)
  console.log(`  Threads: ${finalThreadCount}`)
  console.log(`  Posts: ${finalPostCount}`)
  console.log(`  Gesperrte User: ${bannedUsers.length}`)
  console.log(`  Gelöschte User: ${deletedUsers.length}`)
  console.log('')
  console.log('Test-Zugänge:')
  console.log('  Admin:     admin@forum.local / admin1234')
  console.log('  User:      test1234 (für alle anderen User)')
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
