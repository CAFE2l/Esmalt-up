-- Add opt-out flag for the public "Mural de Formados"
ALTER TABLE "certificates" ADD COLUMN "show_on_wall" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "certificates_wall_idx" ON "certificates"("status", "show_on_wall", "issuedAt");
