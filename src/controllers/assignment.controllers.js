const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

async function createAssignment(req, res, next) {
    try {
        let { material_id, content, deadline } = req.body;
        let material = await prisma.material.findUnique({ where: { id: material_id } });
        if (!material) {
            return res.status(400).json({
                status: false,
                message: 'Material not found',
                error: null,
                data: null
            });
        }

        let existingAssignment = await prisma.assignment.findUnique({ where: { material_id } });
        if (existingAssignment) {
            return res.status(400).json({
                status: false,
                message: 'Assignment already exists',
                error: null,
                data: null
            });
        }

        let assignment = await prisma.assignment.create({ data: { material_id, content, deadline } });
        return res.status(201).json({
            status: true,
            message: 'Assignment created successfully',
            error: null,
            data: assignment
        });

    } catch (error) {
        next(error);
    }
}

async function getAssignments(req, res, next) {
    try {

        let { course_id, user_id, lecturer_id } = req.query;

        let query = `
        SELECT DISTINCT
            course_material_assignments.*,
            (
                SELECT COUNT(*)
                FROM course_enrollments ce
                WHERE ce.course_id = courses.id
            ) AS student_count,
            (
                SELECT COUNT(*)
                FROM course_material_submissions cms
                WHERE cms.assignment_id = course_material_assignments.id
            ) AS student_submission_count
        FROM
            course_material_assignments
            INNER JOIN course_materials course_materials ON course_materials.id = course_material_assignments.material_id
            INNER JOIN courses courses ON courses.id = course_materials.course_id
            LEFT JOIN course_enrollments ON course_enrollments.course_id = courses.id
        WHERE 1=1`;

        if (course_id) query += ` AND courses.id = ${course_id}`;
        if (user_id) query += ` AND course_enrollments.user_id = ${user_id}`;
        if (lecturer_id) query += ` AND courses.lecturer_id = ${lecturer_id}`;

        let assignments = await prisma.$queryRawUnsafe(query);

        assignments.forEach(assignment => {
            assignment.student_submission_count = Number(assignment.student_submission_count) || 0;
            assignment.student_count = Number(assignment.student_count) || 0;
            assignment.submission_progress = (assignment.student_submission_count / assignment.student_count) * 100;
        });

        return res.status(200).json({
            status: true,
            message: 'Assignments retrieved successfully',
            error: null,
            data: assignments
        });
    } catch (error) {
        next(error);
    }
}

async function getAssignmentById(req, res, next) {
    try {
        let assignments = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT
            course_material_assignments.*,
            (
                SELECT COUNT(*)
                FROM course_enrollments ce
                WHERE ce.course_id = courses.id
            ) AS student_count,
            (
                SELECT COUNT(*)
                FROM course_material_submissions cms
                WHERE cms.assignment_id = course_material_assignments.id
            ) AS student_submission_count
        FROM
            course_material_assignments
            INNER JOIN course_materials course_materials ON course_materials.id = course_material_assignments.material_id
            INNER JOIN courses courses ON courses.id = course_materials.course_id
            LEFT JOIN course_enrollments ON course_enrollments.course_id = courses.id
        WHERE course_material_assignments.id = ${req.params.id}`);
        if (!assignments.length) {
            return res.status(400).json({
                status: false,
                message: 'Assignment not found',
                error: null,
                data: null
            });
        }

        let submission = await prisma.$queryRawUnsafe(`
            SELECT
                course_enrollments.user_id,
                CASE
                    WHEN course_material_submissions.id IS NOT NULL THEN true
                    ELSE false
                END AS is_submitted,
                course_material_submissions.date,
                course_material_submissions.description,
                course_material_submissions.url
            FROM
                course_material_assignments
                INNER JOIN course_materials ON course_materials.id = course_material_assignments.material_id
                INNER JOIN course_enrollments ON course_enrollments.course_id = course_materials.course_id
                LEFT JOIN course_material_submissions ON course_material_submissions.user_id = course_enrollments.user_id AND course_material_submissions.assignment_id = course_material_assignments.id
            WHERE
            course_material_assignments.id = ${req.params.id}`);

        assignments.forEach(assignment => {
            assignment.student_submission_count = Number(assignment.student_submission_count) || 0;
            assignment.student_count = Number(assignment.student_count) || 0;
            assignment.submission_progress = (assignment.student_submission_count / assignment.student_count) * 100;
            assignment.submissions = submission;
        });

        return res.status(200).json({
            status: true,
            message: 'Assignment retrieved successfully',
            error: null,
            data: assignments[0]
        });
    } catch (error) {
        next(error);
    }
}

async function submitAssignment(req, res, next) {
    try {
        let { description, url } = req.body;
        let { user_id } = req.query;

        let assignment = await prisma.courseMaterialAssignment.findUnique({ where: { id: Number(req.params.id) } });
        if (!assignment) {
            return res.status(400).json({
                status: false,
                message: 'Assignment not found',
                error: null,
                data: null
            });
        }

        let submitted = await prisma.courseMaterialSubmission.findFirst({ where: { assignment_id: assignment.id, user_id: Number(user_id) } });
        if (submitted) {
            return res.status(400).json({
                status: false,
                message: 'Assignment already submitted',
                error: null,
                data: null
            });
        }

        let submission = await prisma.courseMaterialSubmission.create({ data: { assignment_id: assignment.id, user_id: Number(user_id), description, url } });
        return res.status(201).json({
            status: true,
            message: 'Assignment submitted successfully',
            error: null,
            data: submission
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { createAssignment, getAssignments, getAssignmentById, submitAssignment };