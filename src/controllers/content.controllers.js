const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

async function createContent(req, res, next) {
    try {
        const { title, video_url, body, material_id } = req.body;

        // Check if the course material exists
        const courseMaterialExists = await prisma.courseMaterial.findFirst({ where: { id: Number(material_id) } });
        if (!courseMaterialExists) {
            return res.status(400).json({
                status: false,
                message: 'Course material not found',
                error: null,
                data: null
            });
        }

        // Check if the content is already created
        const contentExists = await prisma.courseMaterialContent.findFirst({
            where: {
                title: title
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
                title,
                body,
                video_url,
                course_material_id: Number(material_id)
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
        let { material_id } = req.query;

        let filter = {};
        if (material_id) {
            filter.where = { course_material_id: Number(material_id) };
        }

        const contents = await prisma.courseMaterialContent.findMany(filter);

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
            return res.status(400).json({
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
        const { title, video_url, body } = req.body;

        let content = await prisma.courseMaterialContent.update({
            where: {
                id: Number(id)
            },
            data: {
                title,
                body,
                video_url,
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

async function markContentWatched(req, res, next) {
    try {
        let { id } = req.params;
        let { user_id } = req.query;

        let content = await prisma.content.findUnique({ where: { id: Number(id) } });
        if (!content) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let watchedContent = await prisma.watchedContent.findFirst({ where: { user_id: user_id, content_id: content.id } });
        if (watchedContent) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content already watched!',
                data: null
            });
        }

        watchedContent = await prisma.watchedContent.create({ data: { user_id: user_id, content_id: content.id } });

        res.status(201).json({
            status: true,
            message: 'OK',
            error: null,
            data: watchedContent
        });
    } catch (err) {
        next(err);
    }
}

async function likeContent(req, res, next) {
    try {
        let { id } = req.params;
        let { user_id } = req.query;

        let content = await prisma.content.findUnique({ where: { id: Number(id) } });
        if (!content) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let like = await prisma.like.findFirst({ where: { content_id: content.id, user_id: user_id } });
        if (like) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'you already liked this content!',
                data: null
            });
        }

        like = await prisma.like.create({ data: { content_id: content.id, user_id: user_id } });

        res.status(201).json({
            status: true,
            message: 'OK',
            error: null,
            data: like
        });
    } catch (err) {
        next(err);
    }
}

async function unlikeContent(req, res, next) {
    try {
        let { id } = req.params;
        let { user_id } = req.query;

        let content = await prisma.content.findUnique({ where: { id: Number(id) } });
        if (!content) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let like = await prisma.like.findFirst({ where: { content_id: content.id, user_id: user_id } });
        if (!like) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'you have not liked this content!',
                data: null
            });
        }

        await prisma.like.delete({ where: { id: like.id } });

        res.status(200).json({
            status: true,
            message: 'OK',
            error: null,
            data: null
        });
    } catch (err) {
        next(err);
    }
}

async function commentContent(req, res, next) {
    try {
        let { id } = req.params;
        let { content } = req.body;
        let { user_id } = req.query;

        let c = await prisma.content.findUnique({ where: { id: Number(id) } });
        if (!c) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let comment = await prisma.comment.create({ data: { content, user_id: user_id, content_id: c.id } });

        res.status(201).json({
            status: true,
            message: 'OK',
            error: null,
            data: comment
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { createContent, getContents, getContentById, updateContent, deleteContent, markContentWatched, likeContent, unlikeContent, commentContent };