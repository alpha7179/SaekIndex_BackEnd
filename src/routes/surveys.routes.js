// src/routes/surveys.routes.js
const express = require('express');
const controller = require('../controllers/surveys.controller');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.post('/', asyncHandler(controller.createSurvey));
router.get('/', asyncHandler(controller.getSurveys));
router.get('/stats', asyncHandler(controller.getStats));
router.put('/:id', asyncHandler(controller.updateSurvey));
router.delete('/:id', asyncHandler(controller.deleteSurvey));

module.exports = router;