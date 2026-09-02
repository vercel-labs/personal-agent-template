import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const threads = pgTable("threads", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  /** The eve session this thread talks to. eve holds the transcript. */
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("threads_user_updated_idx").on(table.userId, table.updatedAt),
]);

export const threadsRelations = relations(threads, ({ one }) => ({
  user: one(user, {
    fields: [threads.userId],
    references: [user.id],
  }),
}));
