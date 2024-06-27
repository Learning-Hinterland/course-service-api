const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

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
        let { search, lecturer_id, is_enrolled } = req.query;
        let { user_id } = req.query;

        let query = `
        SELECT
            courses.*,
            course_enrollments.id AS enrollment_id,
            (
                SELECT COUNT(*)
                FROM
                    course_material_contents c
                    INNER JOIN course_materials l ON l.id = c.material_id
                WHERE l.course_id = courses.id
                GROUP BY l.course_id
            ) AS total_contents,
            (
                SELECT COUNT(*)
                FROM
                    course_material_contents c
                    INNER JOIN watched_contents wc ON wc.content_id = c.id
                    INNER JOIN course_materials l ON l.id = c.material_id
                WHERE l.course_id = courses.id AND wc.user_id = ${user_id}
                GROUP BY l.course_id
            ) AS watched_contents
        FROM
            courses
            LEFT JOIN course_enrollments ON course_enrollments.course_id = courses.id AND course_enrollments.user_id = ${user_id}
        WHERE 1=1`;

        if (search) {
            query += ` AND (courses.name ILIKE '%${search}%' OR courses.description ILIKE '%${search}%')`;
        }
        if (lecturer_id) {
            query += ` AND courses.lecturer_id = ${parseInt(lecturer_id, 10)}`;
        }
        if (is_enrolled === 'true') {
            query += ` AND course_enrollments.id IS NOT NULL`;
        }

        let courses = await prisma.$queryRawUnsafe(query);
        courses = courses.map(course => {
            let c = {
                id: course.id,
                name: course.name,
                description: course.description,
                cover_url: course.cover_url,
                lecturer: {
                    id: course.lecturer_id,
                    name: course.lecturer_name
                },
                is_enrolled: false
            };
            if (course.enrollment_id) {
                c.is_enrolled = true;
                c.progress = {
                    total_contents: Number(course.total_contents),
                    watched_contents: Number(course.watched_contents),
                    percentage: parseInt(Number(course.watched_contents) / Number(course.total_contents) * 100)
                };
            }
            return c;
        });

        res.status(200).json({
            status: true,
            message: 'OK',
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
        let { id } = req.params;
        let { user_id } = req.query;

        let course = await prisma.$queryRawUnsafe(`
          SELECT 
            courses.id,
            courses.name,
            courses.description,
            courses.cover_url,

            course_materials.id AS material_id,
            course_materials.title AS material_title,
            course_materials.description AS material_description,
            course_materials.course_id AS material_course_id,

            course_material_contents.id AS content_id,
            course_material_contents.title AS content_title,
            course_material_contents.body AS content_body,
            course_material_contents.video_url AS content_video_url,
            course_material_contents.material_id AS content_material_id,

            courses.lecturer_id,
            course_enrollments.id AS enrollment_id,

            (
                SELECT COUNT(*)
                FROM
                    course_material_contents c
                    INNER JOIN course_materials l ON l.id = c.material_id
                WHERE l.course_id = courses.id
                GROUP BY l.course_id
            ) AS course_total_contents,
            (
                SELECT COUNT(*)
                FROM
                    course_material_contents c
                    INNER JOIN watched_contents wc ON wc.content_id = c.id
                    INNER JOIN course_materials l ON l.id = c.material_id
                WHERE l.course_id = courses.id AND wc.user_id = ${user_id}
                GROUP BY l.course_id
            ) AS course_watched_contents,
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
            courses
            LEFT JOIN course_materials ON course_materials.course_id = courses.id
            LEFT JOIN course_material_contents ON course_material_contents.material_id = course_materials.id
            LEFT JOIN course_enrollments ON course_enrollments.course_id = courses.id AND course_enrollments.user_id = ${user_id}
            LEFT JOIN likes ON likes.content_id = course_material_contents.id AND likes.user_id = ${user_id}
        WHERE
            courses.id = ${id};`);
        if (!course.length) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'course not found!',
                data: null
            });
        }

        let comments = await prisma.$queryRawUnsafe(`
        SELECT comments.*
            FROM comments
            INNER JOIN course_material_contents ON course_material_contents.id = comments.content_id
            INNER JOIN course_materials ON course_materials.id = course_material_contents.material_id
        WHERE course_materials.course_id = ${Number(id)}
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

        const coursesMap = new Map();
        const materialsMap = new Map();
        course.forEach(item => {
            // Find or create the course
            if (!coursesMap.has(item.id)) {
                let c = {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    cover_url: item.cover_url,
                    lecturer: {
                        id: item.lecturer_id,
                    },
                    materials: [],
                    is_enrolled: false
                };
                if (item.enrollment_id) {
                    c.is_enrolled = true;
                    c.progress = {
                        total_contents: Number(item.course_total_contents),
                        watched_contents: Number(item.course_watched_contents),
                        percentage: parseInt(Number(item.course_watched_contents) / Number(item.course_total_contents) * 100)
                    };
                }
                coursesMap.set(item.id, c);
            }

            if (!item.material_id) {
                return;
            }

            // Find or create the material
            const course = coursesMap.get(item.id);
            const materialKey = `${item.material_id}-${item.id}`;
            if (!materialsMap.has(materialKey)) {
                let l = {
                    id: item.material_id,
                    title: item.material_title,
                    description: item.material_description,
                    course_id: item.material_course_id,
                    contents: []
                };
                if (item.enrollment_id) {
                    l.progress = {
                        total_contents: Number(item.material_total_contents),
                        watched_contents: Number(item.material_watched_contents),
                        percentage: parseInt(Number(item.material_watched_contents) / Number(item.material_total_contents) * 100)
                    };
                }
                materialsMap.set(materialKey, l);
                course.materials.push(materialsMap.get(materialKey));
            }

            if (!item.content_id) {
                return;
            }

            // Add content to the material
            const material = materialsMap.get(materialKey);
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

        // Convert the courses map to an array
        const response = Array.from(coursesMap.values());

        res.status(200).json({
            status: true,
            message: 'OK',
            error: null,
            data: response[0]
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

async function enrollCourse(req, res, next) {
    try {
        let { id } = req.params;
        let { user_id } = req.query;

        console.log("id", id);
        console.log("req.query", req.query);
        console.log("user_id", user_id);

        let course = await prisma.course.findUnique({ where: { id: Number(id) } });
        if (!course) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'course not found!',
                data: null
            });
        }

        let exist = await prisma.courseEnrollment.findFirst({ where: { course_id: course.id, user_id: Number(user_id) } });
        if (exist) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'already enrolled!',
                data: null
            });
        }

        let enrollment = await prisma.courseEnrollment.create({
            data: {
                course_id: course.id,
                user_id: Number(user_id)
            }
        });

        return res.status(201).json({
            status: true,
            message: 'OK',
            error: null,
            data: enrollment
        });
    } catch (err) {
        next(err);
    }
}

async function unenrollCourse(req, res, next) {
    try {
        let { id } = req.params;
        let { user_id } = req.query;

        console.log("user_id", user_id);
        console.log("req.query", req.query);

        let enrollment = await prisma.courseEnrollment.findFirst({ where: { course_id: Number(id), user_id: Number(user_id) } });
        if (!enrollment) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                error: 'not enrolled!',
                data: null
            });
        }

        await prisma.courseEnrollment.delete({ where: { id: enrollment.id } });

        return res.status(200).json({
            status: true,
            message: 'OK',
            error: null,
            data: null
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse, enrollCourse, unenrollCourse };