const router = require('express').Router();
const courseController = require('../controllers/course.controllers');

router.post('/', courseController.createCourse);
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

router.post('/:id/enroll', courseController.enrollCourse);
router.delete('/:id/unenroll', courseController.unenrollCourse);

module.exports = router;