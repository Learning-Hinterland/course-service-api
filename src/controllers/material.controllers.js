const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

async function createMaterial(req, res, next) {
    try {
        const { title, description, course_id } = req.body;

        // Check if the course exists
        const courseExists = await prisma.course.findFirst({ where: { id: Number(course_id) } });
        if (!courseExists) {
            return res.status(400).json({
                status: false,
                message: 'Course not found',
                error: null,
                data: null
            });
        }

        // Check if the material is already created
        const materialExists = await prisma.courseMaterial.findFirst({
            where: {
                title: title,
                course_id: Number(course_id)
            }
        });
        if (materialExists) {
            return res.status(400).json({
                status: false,
                message: 'Material already exists',
                error: null,
                data: null
            });
        }

        let material = await prisma.courseMaterial.create({
            data: {
                title,
                description,
                course_id: Number(course_id)
            }
        });

        res.status(201).json({
            status: true,
            message: 'Material created successfully',
            error: null,
            data: material
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get all materials
async function getMaterials(req, res, next) {
    try {
        let { course_id } = req.query;

        let filter = {};
        if (course_id) {
            filter.where = { course_id: Number(course_id) };
        }

        const materials = await prisma.courseMaterial.findMany(filter);

        res.status(200).json({
            status: true,
            message: 'Materials retrieved successfully',
            error: null,
            data: materials
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get material by id
async function getMaterialById(req, res, next) {
    try {
        const { id } = req.params;
        const { user_id } = req.query;

        let materials = await prisma.$queryRawUnsafe(`
        SELECT
            course_materials.id,
            course_materials.title,
            course_materials.description,
            course_materials.course_id,

            course_material_contents.id AS content_id,
            course_material_contents.title AS content_title,
            course_material_contents.body AS content_body,
            course_material_contents.video_url AS content_video_url,
            course_material_contents.material_id AS content_material_id,

            course_enrollments.id AS enrollment_id,

            course_material_assignments.id AS assignment_id,
            course_material_assignments.content AS assignment_content,
            course_material_assignments.deadline AS assignment_deadline,
            (
                SELECT COUNT(*)
                FROM course_enrollments ce
                WHERE ce.course_id = courses.id
            ) AS assignment_student_count,
            (
                SELECT COUNT(*)
                FROM course_material_submissions cms
                WHERE cms.assignment_id = course_material_assignments.id
            ) AS assignment_student_submission_count,

            (
                SELECT COUNT(*)
                FROM
                    course_material_contents c
                    INNER JOIN course_materials l ON l.id = c.material_id
                WHERE c.material_id = course_materials.id
                GROUP BY c.material_id
            ) AS material_total_contents,
            (
                SELECT COUNT(*)
                FROM
                    course_material_contents c
                    INNER JOIN watched_contents wc ON wc.content_id = c.id
                    INNER JOIN course_materials l ON l.id = c.material_id
                WHERE c.material_id = course_materials.id AND wc.user_id = ${user_id}
                GROUP BY c.material_id
            ) AS material_watched_contents,
            (
                SELECT COUNT(*) FROM likes WHERE content_id = course_material_contents.id GROUP BY content_id
            ) likes_count,
            CASE
                WHEN likes.id IS NOT NULL THEN true
                ELSE false
            END AS is_liked
        FROM
            course_materials
            INNER JOIN courses ON courses.id = course_materials.course_id
            LEFT JOIN course_material_contents ON course_material_contents.material_id = course_materials.id
            LEFT JOIN course_enrollments ON course_enrollments.course_id = courses.id AND course_enrollments.user_id = ${user_id}
            LEFT JOIN likes ON likes.content_id = course_material_contents.id AND likes.user_id = ${user_id}
            LEFT JOIN course_material_assignments ON course_material_assignments.material_id = course_materials.id
        WHERE course_materials.id = ${id};`);
        if (!materials.length) {
            return res.status(400).json({
                status: false,
                message: 'Material not found',
                error: null,
                data: null
            });
        }

        let comments = await prisma.$queryRawUnsafe(`
            SELECT comments.*
                FROM comments
                INNER JOIN course_material_contents ON course_material_contents.id = comments.content_id
            WHERE course_material_contents.material_id = ${Number(id)}
            ORDER BY comments.date;`);
        let commentsMap = {};
        comments.forEach(comment => {
            if (!commentsMap[comment.content_id]) {
                commentsMap[comment.content_id] = [];
            }
            commentsMap[comment.content_id].push({
                id: comment.id,
                user: {
                    id: comment.user_id
                },
                content: comment.content,
                date: comment.date
            });
        });

        const materialsMap = new Map();
        materials.forEach(item => {
            // Find or create the course
            if (!materialsMap.has(item.id)) {
                let l = {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    course_id: item.course_id,
                    contents: [],
                    is_having_assignment: item.assignment_id ? true : false
                };
                if (item.enrollment_id) {
                    l.progress = {
                        total_contents: Number(item.material_total_contents),
                        watched_contents: Number(item.material_watched_contents),
                        percentage: parseInt(Number(item.material_watched_contents) / Number(item.material_total_contents) * 100)
                    };
                }
                if (item.assignment_id) {
                    l.assignment = {
                        id: item.assignment_id,
                        content: item.assignment_content,
                        deadline: item.assignment_deadline,
                        student_count: Number(item.assignment_student_count),
                        student_submission_count: Number(item.assignment_student_submission_count),
                        submission_progress: (Number(item.assignment_student_submission_count) / Number(item.assignment_student_count)) * 100
                    };
                }
                materialsMap.set(item.id, l);
            }

            if (!item.content_id) {
                return;
            }

            // Add content to the material
            const material = materialsMap.get(item.id);
            material.contents.push({
                id: item.content_id,
                title: item.content_title,
                body: item.content_body,
                video_url: item.content_video_url,
                likes_count: Number(item.likes_count),
                likes: item.is_liked,
                comments: commentsMap[item.content_id] || []
            });
        });

        const response = Array.from(materialsMap.values());

        res.status(200).json({
            status: true,
            message: 'Material retrieved successfully',
            error: null,
            data: response[0]
        });
    } catch (error) {
        next(error);
    }
}

// endpoint update material by id
async function updateMaterial(req, res, next) {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        let material = await prisma.courseMaterial.update({
            where: {
                id: Number(id)
            },
            data: {
                title,
                description
            }
        });

        res.status(200).json({
            status: true,
            message: 'Material updated successfully',
            error: null,
            data: material
        });
    } catch (error) {
        next(error);
    }
}

// endpoint delete material by id
async function deleteMaterial(req, res, next) {
    try {
        const { id } = req.params;
        await prisma.courseMaterial.delete({
            where: {
                id: Number(id)
            }
        });

        res.status(200).json({
            status: true,
            message: 'Material deleted successfully',
            error: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };