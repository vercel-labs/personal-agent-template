import { index, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const slackLinks = pgTable("slack_links", {
  appUserId: text("app_user_id").notNull(),
  slackTeamId: text("slack_team_id").notNull(),
  slackUserId: text("slack_user_id").notNull(),
  slackUserName: text("slack_user_name"),
  slackDisplayName: text("slack_display_name"),
  slackEmail: text("slack_email"),
  linkedAt: timestamp("linked_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.slackTeamId, table.slackUserId] }),
  uniqueIndex("slack_links_app_user_idx").on(table.appUserId),
]);

export const slackLinkCodes = pgTable("slack_link_codes", {
  code: text().primaryKey(),
  appUserId: text("app_user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("slack_link_codes_app_user_idx").on(table.appUserId),
]);
