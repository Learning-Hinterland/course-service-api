const router = require('express').Router();
const contentController = require('../controllers/content.controllers');

router.post('/', contentController.createContent);
router.get('/', contentController.getContents);
router.get('/:id', contentController.getContentById);
router.put('/:id', contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

router.post('/:id/watch', contentController.markContentWatched);
router.post('/:id/like', contentController.likeContent);
router.delete('/:id/unlike', contentController.unlikeContent);
router.post('/:id/comment', contentController.commentContent);

module.exports = router;