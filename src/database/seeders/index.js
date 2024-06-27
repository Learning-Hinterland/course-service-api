const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const courses = require('./data/courses.json');

async function generateCourse() {
    try {
        // Create courses
        for (let c of courses) {
            const course = await prisma.course.create({
                data: {
                    name: c.name,
                    description: c.description,
                    cover_url: c.cover_url,
                    lecturer_id: 0
                }
            });

            // Create materials
            for (let m of c.materials) {
                const material = await prisma.courseMaterial.create({
                    data: {
                        title: m.title,
                        description: m.description,
                        course_id: course.id
                    }
                });

                // Create contents
                let contents = m.contents.map(c => ({
                    title: c.title,
                    body: c.body,
                    video_url: c.video_url,
                    material_id: material.id
                }));
                await prisma.courseMaterialContent.createMany({
                    data: contents
                });
            }
        }

        console.log("Data seeding completed successfully.");
    } catch (error) {
        console.error("Error seeding data:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

generateCourse()
    .catch((e) => {
        console.error("generateCourse function error:", e);
        process.exit(1);
    });
