import { Router, type IRouter } from "express";
import { db, booksTable, sessionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { ListSessionsQueryParams, CreateSessionBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sessions", async (req, res) => {
  const { limit, bookId } = ListSessionsQueryParams.parse(req.query);
  const rows = await db
    .select({
      id: sessionsTable.id,
      bookId: sessionsTable.bookId,
      pagesRead: sessionsTable.pagesRead,
      notes: sessionsTable.notes,
      loggedAt: sessionsTable.loggedAt,
      bookTitle: booksTable.title,
    })
    .from(sessionsTable)
    .innerJoin(booksTable, eq(booksTable.id, sessionsTable.bookId))
    .where(bookId ? eq(sessionsTable.bookId, bookId) : sql`true`)
    .orderBy(desc(sessionsTable.loggedAt))
    .limit(limit ?? 50);
  res.json(
    rows.map((r) => ({
      id: r.id,
      bookId: r.bookId,
      bookTitle: r.bookTitle,
      pagesRead: r.pagesRead,
      notes: r.notes,
      loggedAt: r.loggedAt.toISOString(),
    })),
  );
});

router.post("/sessions", async (req, res) => {
  const body = CreateSessionBody.parse(req.body);
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, body.bookId));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const [s] = await db
    .insert(sessionsTable)
    .values({
      bookId: body.bookId,
      pagesRead: body.pagesRead,
      notes: body.notes ?? null,
    })
    .returning();

  const newPagesRead = Math.min(book.totalPages, book.pagesRead + body.pagesRead);
  const isCompleted = newPagesRead >= book.totalPages;
  await db
    .update(booksTable)
    .set({
      pagesRead: newPagesRead,
      completedAt: isCompleted && !book.completedAt ? new Date() : book.completedAt,
    })
    .where(eq(booksTable.id, body.bookId));

  res.json({
    id: s.id,
    bookId: s.bookId,
    bookTitle: book.title,
    pagesRead: s.pagesRead,
    notes: s.notes,
    loggedAt: s.loggedAt.toISOString(),
  });
});

export default router;
