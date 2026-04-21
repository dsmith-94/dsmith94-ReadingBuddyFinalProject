import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  genre: text("genre"),
  totalPages: integer("total_pages").notNull(),
  pagesRead: integer("pages_read").notNull().default(0),
  targetCompletionDate: date("target_completion_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessionsTable = pgTable("reading_sessions", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  pagesRead: integer("pages_read").notNull(),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Book = typeof booksTable.$inferSelect;
export type ReadingSession = typeof sessionsTable.$inferSelect;
