import { Router, type IRouter } from "express";
import { db, booksTable, sessionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListBooksQueryParams,
  CreateBookBody,
  GetBookParams,
  UpdateBookParams,
  UpdateBookBody,
  DeleteBookParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/books", async (req, res) => {
  const { status } = ListBooksQueryParams.parse(req.query);
  const rows = await db.select().from(booksTable).orderBy(desc(booksTable.createdAt));
  const filtered = rows.filter((b) => {
    if (status === "completed") return b.completedAt !== null;
    if (status === "reading") return b.completedAt === null;
    return true;
  });
  res.json(
    filtered.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genre: b.genre,
      totalPages: b.totalPages,
      pagesRead: b.pagesRead,
      targetCompletionDate: b.targetCompletionDate,
      completedAt: b.completedAt ? b.completedAt.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
    })),
  );
});

router.post("/books", async (req, res) => {
  const body = CreateBookBody.parse(req.body);
  const [b] = await db
    .insert(booksTable)
    .values({
      title: body.title,
      author: body.author ?? null,
      genre: body.genre ?? null,
      totalPages: body.totalPages,
      targetCompletionDate: body.targetCompletionDate ?? null,
    })
    .returning();
  res.json({
    id: b.id,
    title: b.title,
    author: b.author,
    genre: b.genre,
    totalPages: b.totalPages,
    pagesRead: b.pagesRead,
    targetCompletionDate: b.targetCompletionDate,
    completedAt: b.completedAt ? b.completedAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
  });
});

router.get("/books/:id", async (req, res) => {
  const { id } = GetBookParams.parse(req.params);
  const [b] = await db.select().from(booksTable).where(eq(booksTable.id, id));
  if (!b) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.bookId, id))
    .orderBy(desc(sessionsTable.loggedAt));
  res.json({
    book: {
      id: b.id,
      title: b.title,
      author: b.author,
      genre: b.genre,
      totalPages: b.totalPages,
      pagesRead: b.pagesRead,
      targetCompletionDate: b.targetCompletionDate,
      completedAt: b.completedAt ? b.completedAt.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
    },
    sessions: sessions.map((s) => ({
      id: s.id,
      bookId: s.bookId,
      bookTitle: b.title,
      pagesRead: s.pagesRead,
      notes: s.notes,
      loggedAt: s.loggedAt.toISOString(),
    })),
  });
});

router.patch("/books/:id", async (req, res) => {
  const { id } = UpdateBookParams.parse(req.params);
  const body = UpdateBookBody.parse(req.body);
  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.author !== undefined) update.author = body.author;
  if (body.genre !== undefined) update.genre = body.genre;
  if (body.totalPages !== undefined) update.totalPages = body.totalPages;
  if (body.targetCompletionDate !== undefined) update.targetCompletionDate = body.targetCompletionDate;
  const [b] = await db.update(booksTable).set(update).where(eq(booksTable.id, id)).returning();
  if (!b) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: b.id,
    title: b.title,
    author: b.author,
    genre: b.genre,
    totalPages: b.totalPages,
    pagesRead: b.pagesRead,
    targetCompletionDate: b.targetCompletionDate,
    completedAt: b.completedAt ? b.completedAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
  });
});

router.delete("/books/:id", async (req, res) => {
  const { id } = DeleteBookParams.parse(req.params);
  await db.delete(booksTable).where(eq(booksTable.id, id));
  res.json({ ok: true });
});

export default router;
export { sql };
