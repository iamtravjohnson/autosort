ALTER TABLE "sources" ADD COLUMN "autopilot" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "dismissed_rules" jsonb DEFAULT '[]'::jsonb NOT NULL;