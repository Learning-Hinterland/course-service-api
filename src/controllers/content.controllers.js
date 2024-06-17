const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(
    {
        log: ['query'],
    }
);

async function createContent(req, res, next) {
    try {
        const { name, description, course_id } = req.body;

        // Check if the content is already created
        const contentExists = await prisma.courseMaterialContent.findFirst({
            where: {
                name: name
            }
        });
        if (contentExists) {
            return res.status(400).json({
                status: false,
                message: 'Content already exists',
                error: null,
                data: null
            });
        }

        let content = await prisma.courseMaterialContent.create({
            data: {
                name,
                description,
                course_id: Number(course_id)
            }
        });

        res.status(201).json({
            status: true,
            message: 'Content created successfully',
            error: null,
            data: content
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get all contents
async function getContents(req, res, next) {
    try {
        const contents = await prisma.courseMaterialContent.findMany({
            include: {
                lecturer: true
            }
        });

        res.status(200).json({
            status: true,
            message: 'Contents retrieved successfully',
            error: null,
            data: contents
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get content by id
async function getContentById(req, res, next) {
    try {
        const { id } = req.params;
        const content = await prisma.courseMaterialContent.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!content) {
            return res.status(404).json({
                status: false,
                message: 'Content not found',
                error: null,
                data: null
            });
        }

        res.status(200).json({
            status: true,
            message: 'Content retrieved successfully',
            error: null,
            data: content
        });
    } catch (error) {
        next(error);
    }
}

// endpoint update content by id
async function updateContent(req, res, next) {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        let content = await prisma.courseMaterialContent.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                description
            }
        });

        res.status(200).json({
            status: true,
            message: 'Content updated successfully',
            error: null,
            data: content
        });
    } catch (error) {
        next(error);
    }
}

// endpoint delete content by id
async function deleteContent(req, res, next) {
    try {
        const { id } = req.params;
        await prisma.courseMaterialContent.delete({
            where: {
                id: Number(id)
            }
        });

        res.status(200).json({
            status: true,
            message: 'Content deleted successfully',
            error: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { createContent, getContents, getContentById, updateContent, deleteContent };