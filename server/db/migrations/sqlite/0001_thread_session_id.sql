ALTER TABLE `threads` ADD `session_id` text;
--> statement-breakpoint
-- Carry the eve session id out of the `state` JSON blob. Rows without one
-- get NULL and open a fresh session on their next message.
UPDATE `threads`
SET `session_id` = json_extract(`state`, '$.session.sessionId')
WHERE `state` IS NOT NULL
  AND json_valid(`state`)
  AND json_extract(`state`, '$.session.sessionId') IS NOT NULL;
