import { Router, type IRouter } from "express";
import { db, booksTable, sessionsTable } from "@workspace/db";
import { sql, isNull, isNotNull, gte } from "drizzle-orm";
import { GetDailyStatsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/goals", async (_req, res) => {
  const books = await db.select().from(booksTable).where(isNull(booksTable.completedAt));
  const out = await Promise.all(
    books.map(async (b) => {
      const rows = await db
        .select({
          totalPages: sql<number>`coalesce(sum(${sessionsTable.pagesRead}), 0)::int`,
          firstAt: sql<Date | null>`min(${sessionsTable.loggedAt})`,
        })
        .from(sessionsTable)
        .where(sql`${sessionsTable.bookId} = ${b.id}`);
      const stat = rows[0];
      const firstAt = stat?.firstAt ? new Date(stat.firstAt) : null;
      const daysActive = firstAt
        ? Math.max(1, Math.ceil((Date.now() - firstAt.getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
      const avg = b.pagesRead > 0 ? b.pagesRead / daysActive : 0;
      const remaining = Math.max(0, b.totalPages - b.pagesRead);
      let estimatedDate: string | null = null;
      if (avg > 0) {
        const daysLeft = Math.ceil(remaining / avg);
        const eta = new Date();
        eta.setDate(eta.getDate() + daysLeft);
        estimatedDate = eta.toISOString().slice(0, 10);
      } else if (b.targetCompletionDate) {
        estimatedDate = b.targetCompletionDate;
      }
      return {
        bookId: b.id,
        bookTitle: b.title,
        pagesCompleted: b.pagesRead,
        totalPages: b.totalPages,
        estimatedDateCompleted: estimatedDate,
        avgPagesPerDay: Math.round(avg * 10) / 10,
      };
    }),
  );
  res.json(out);
});

router.get("/stats/summary", async (_req, res) => {
  const allBooks = await db.select().from(booksTable);
  const totalPagesRead = allBooks.reduce((s, b) => s + b.pagesRead, 0);
  const booksCompleted = allBooks.filter((b) => b.completedAt !== null).length;
  const booksInProgress = allBooks.length - booksCompleted;

  const sessionsCountRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(sessionsTable);
  const sessionsLogged = sessionsCountRows[0]?.c ?? 0;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const todayRows = await db
    .select({ s: sql<number>`coalesce(sum(${sessionsTable.pagesRead}), 0)::int` })
    .from(sessionsTable)
    .where(gte(sessionsTable.loggedAt, startOfToday));
  const weekRows = await db
    .select({ s: sql<number>`coalesce(sum(${sessionsTable.pagesRead}), 0)::int` })
    .from(sessionsTable)
    .where(gte(sessionsTable.loggedAt, startOfWeek));

  const firstSessionRow = await db
    .select({ d: sql<Date | null>`min(${sessionsTable.loggedAt})` })
    .from(sessionsTable);
  const firstAt = firstSessionRow[0]?.d ? new Date(firstSessionRow[0].d) : null;
  const daysActive = firstAt
    ? Math.max(1, Math.ceil((Date.now() - firstAt.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const avgPagesPerDay = totalPagesRead > 0 ? Math.round((totalPagesRead / daysActive) * 10) / 10 : 0;

  res.json({
    totalPagesRead,
    booksCompleted,
    booksInProgress,
    sessionsLogged,
    pagesToday: todayRows[0]?.s ?? 0,
    pagesThisWeek: weekRows[0]?.s ?? 0,
    avgPagesPerDay,
  });
  void isNotNull;
});

router.get("/stats/daily", async (req, res) => {
  const { days } = GetDailyStatsQueryParams.parse(req.query);
  const n = days ?? 14;
  const since = new Date();
  since.setDate(since.getDate() - (n - 1));
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${sessionsTable.loggedAt}), 'YYYY-MM-DD')`,
      pages: sql<number>`coalesce(sum(${sessionsTable.pagesRead}), 0)::int`,
    })
    .from(sessionsTable)
    .where(gte(sessionsTable.loggedAt, since))
    .groupBy(sql`date_trunc('day', ${sessionsTable.loggedAt})`);

  const map = new Map<string, number>();
  for (const r of rows) map.set(r.day, r.pages);

  const out: { date: string; pages: number }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, pages: map.get(key) ?? 0 });
  }
  res.json(out);
});

router.get("/stats/streak", async (_req, res) => {
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${sessionsTable.loggedAt}), 'YYYY-MM-DD')`,
    })
    .from(sessionsTable)
    .groupBy(sql`date_trunc('day', ${sessionsTable.loggedAt})`)
    .orderBy(sql`date_trunc('day', ${sessionsTable.loggedAt}) desc`);

  const days = rows.map((r) => r.day);
  const set = new Set(days);

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayKey = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  let currentStreak = 0;
  const cursor = new Date();
  if (!set.has(todayKey)) {
    if (set.has(yesterdayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      cursor.setTime(0);
    }
  }
  if (cursor.getTime() > 0) {
    while (set.has(cursor.toISOString().slice(0, 10))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  let longestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  const sorted = [...days].sort();
  for (const d of sorted) {
    const dt = new Date(d);
    if (prev) {
      const diff = Math.round((dt.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) run++;
      else run = 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = dt;
  }

  res.json({ currentStreak, longestStreak });
});

export default router;
