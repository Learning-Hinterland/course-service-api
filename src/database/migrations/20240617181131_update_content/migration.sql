/*
  Warnings:

  - You are about to drop the column `content` on the `course_material_contents` table. All the data in the column will be lost.
  - Added the required column `title` to the `course_material_contents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "course_material_contents" DROP COLUMN "content",
ADD COLUMN     "body" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "video_url" DROP NOT NULL;
