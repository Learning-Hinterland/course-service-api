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
                material_id: Number(material_id)
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
            filter.where = { material_id: Number(material_id) };
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
        const { user_id } = req.query;

        let contents = await prisma.$queryRawUnsafe(`
        SELECT
            course_material_contents.id,
            course_material_contents.title,
            course_material_contents.body,
            course_material_contents.video_url,
            course_material_contents.material_id,
            course_enrollments.id AS enrollment_id,
            ( SELECT COUNT(*) FROM likes WHERE content_id = course_material_contents.id GROUP BY content_id ) likes_count,
            CASE
                WHEN likes.id IS NOT NULL THEN true
                ELSE false
            END AS is_liked
        FROM
            course_material_contents
            INNER JOIN course_materials ON course_materials.id = course_material_contents.material_id
            INNER JOIN courses ON courses.id = course_materials.course_id
            LEFT JOIN course_enrollments ON course_enrollments.course_id = courses.id AND course_enrollments.user_id = ${user_id}
            LEFT JOIN likes ON likes.content_id = course_material_contents.id AND likes.user_id = ${user_id}
        WHERE course_material_contents.id = ${id}`);
        if (!contents.length) {
            return res.status(400).json({
                status: false,
                message: 'Content not found',
                error: null,
                data: null
            });
        }

        let comments = await prisma.$queryRawUnsafe(`
            SELECT comments.*
                FROM comments
            WHERE comments.content_id = ${Number(id)}
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

        contents = contents.map(content => {
            return {
                id: content.id,
                title: content.title,
                body: content.body,
                video_url: content.video_url,
                likes_count: Number(content.likes_count),
                likes: content.is_liked,
                comments: commentsMap[content.id] || []
            };
        });

        res.status(200).json({
            status: true,
            message: 'Content retrieved successfully',
            error: null,
            data: contents[0]
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

        let content = await prisma.courseMaterialContent.findUnique({ where: { id: Number(id) } });
        if (!content) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let watchedContent = await prisma.watchedContent.findFirst({ where: { user_id: Number(user_id), content_id: content.id } });
        if (watchedContent) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content already watched!',
                data: null
            });
        }

        watchedContent = await prisma.watchedContent.create({ data: { user_id: Number(user_id), content_id: content.id } });

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

        let content = await prisma.courseMaterialContent.findUnique({ where: { id: Number(id) } });
        if (!content) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let like = await prisma.like.findFirst({ where: { content_id: content.id, user_id: Number(user_id) } });
        if (like) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'you already liked this content!',
                data: null
            });
        }

        like = await prisma.like.create({ data: { content_id: content.id, user_id: Number(user_id) } });

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

        let content = await prisma.courseMaterialContent.findUnique({ where: { id: Number(id) } });
        if (!content) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let like = await prisma.like.findFirst({ where: { content_id: content.id, user_id: Number(user_id) } });
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

        let c = await prisma.courseMaterialContent.findUnique({ where: { id: Number(id) } });
        if (!c) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'content not found!',
                data: null
            });
        }

        let comment = await prisma.comment.create({ data: { content, user_id: Number(user_id), content_id: c.id } });

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