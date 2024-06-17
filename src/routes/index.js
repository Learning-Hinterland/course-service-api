const router = require('express').Router();
const courseRouter = require('./course.router');
const materialRouter = require('./material.router');
const contentRouter = require('./content.router');

router.use('/courses', courseRouter);
router.use('/materials', materialRouter);
router.use('/contents', contentRouter);

module.exports = router;