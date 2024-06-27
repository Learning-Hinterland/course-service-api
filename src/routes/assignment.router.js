const router = require('express').Router();
const assignmentController = require('../controllers/assignment.controllers');

router.post('/', assignmentController.createAssignment);
router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/:id/submit', assignmentController.submitAssignment);

module.exports = router;