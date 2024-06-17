const router = require('express').Router();
const materialController = require('../controllers/material.controllers');

router.post('/', materialController.createMaterial);
router.get('/', materialController.getMaterials);
router.get('/:id', materialController.getMaterialById);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);

module.exports = router;