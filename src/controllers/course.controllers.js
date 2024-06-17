const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(
    {
        log: ['query'],
    }
);

async function createCourse(req, res, next) {
    try {
        const { name, description, cover_url, lecturer_id } = req.body;

        // Check if the course is already created
        const courseExists = await prisma.course.findFirst({
            where: {
                name: name
            }
        });
        if (courseExists) {
            return res.status(400).json({
                status: false,
                message: 'Course already exists',
                error: null,
                data: null
            });
        }

        let course = await prisma.course.create({
            data: {
                name,
                description,
                cover_url,
                lecturer_id: Number(lecturer_id)
            }
        });

        res.status(201).json({
            status: true,
            message: 'Course created successfully',
            error: null,
            data: course
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get all courses
async function getCourses(req, res, next) {
    try {
        const courses = await prisma.course.findMany({
            include: {
                lecturer: true
            }
        });

        res.status(200).json({
            status: true,
            message: 'Courses retrieved successfully',
            error: null,
            data: courses
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get course by id
async function getCourseById(req, res, next) {
    try {
        const { id } = req.params;
        const course = await prisma.course.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!course) {
            return res.status(404).json({
                status: false,
                message: 'Course not found',
                error: null,
                data: null
            });
        }

        res.status(200).json({
            status: true,
            message: 'Course retrieved successfully',
            error: null,
            data: course
        });
    } catch (error) {
        next(error);
    }
}

// endpoint update course by id
async function updateCourse(req, res, next) {
    try {
        const { id } = req.params;
        const { name, description, cover_url } = req.body;

        let course = await prisma.course.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                description,
                cover_url
            }
        });

        res.status(200).json({
            status: true,
            message: 'Course updated successfully',
            error: null,
            data: course
        });
    } catch (error) {
        next(error);
    }
}

// endpoint delete course by id
async function deleteCourse(req, res, next) {
    try {
        const { id } = req.params;
        await prisma.course.delete({
            where: {
                id: Number(id)
            }
        });

        res.status(200).json({
            status: true,
            message: 'Course deleted successfully',
            error: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse };