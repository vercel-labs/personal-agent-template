ALTER TABLE `threads` ADD `session_id` text;
--> statement-breakpoint
-- Carry the eve session id out of the old `state` JSON blob so existing
-- threads keep talking to the session they already have. Threads written
-- before eve 0.31 hold a continuation token and no session id; they get NULL
-- and start a fresh session on their next message.
UPDATE `threads`
SET `session_id` = json_extract(`state`, '$.session.sessionId')
WHERE `state` IS NOT NULL
  AND json_valid(`state`)
  AND json_extract(`state`, '$.session.sessionId') IS NOT NULL;
