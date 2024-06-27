const router = require('express').Router();
const courseRouter = require('./course.router');
const materialRouter = require('./material.router');
const contentRouter = require('./content.router');
const assignmentRouter = require('./assignment.router');

router.use('/courses', courseRouter);
router.use('/materials', materialRouter);
router.use('/contents', contentRouter);
router.use('/assignments', assignmentRouter);

module.exports = router;