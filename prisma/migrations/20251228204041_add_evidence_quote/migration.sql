/*
  Warnings:

  - Added the required column `evidenceQuote` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "textId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "promptNl" TEXT NOT NULL,
    "promptAr" TEXT NOT NULL,
    "optionsJson" TEXT NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanationNl" TEXT NOT NULL,
    "explanationAr" TEXT NOT NULL,
    "trapNoteNl" TEXT,
    "trapNoteAr" TEXT,
    "evidenceQuote" TEXT,
    "evidenceStart" INTEGER,
    "evidenceEnd" INTEGER,
    CONSTRAINT "questions_textId_fkey" FOREIGN KEY ("textId") REFERENCES "texts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("correctIndex", "difficulty", "evidenceEnd", "evidenceStart", "explanationAr", "explanationNl", "id", "optionsJson", "orderIndex", "promptAr", "promptNl", "textId", "trapNoteAr", "trapNoteNl", "type") SELECT "correctIndex", "difficulty", "evidenceEnd", "evidenceStart", "explanationAr", "explanationNl", "id", "optionsJson", "orderIndex", "promptAr", "promptNl", "textId", "trapNoteAr", "trapNoteNl", "type" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
CREATE INDEX "questions_textId_orderIndex_idx" ON "questions"("textId", "orderIndex");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
