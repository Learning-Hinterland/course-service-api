const router = require('express').Router();
const contentController = require('../controllers/content.controllers');

router.post('/', contentController.createContent);
router.get('/', contentController.getContents);
router.get('/:id', contentController.getContentById);
router.put('/:id', contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

module.exports = router;