-- CreateTable
CREATE TABLE "course_material_assignments" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),

    CONSTRAINT "course_material_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_material_submissions" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_material_submissions_pkey" PRIMARY KEY ("id")
);
