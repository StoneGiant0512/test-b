const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Note: Authentication middleware is applied in routes/index.js

/**
 * @route   GET /api/projects
 * @desc    Get all projects with optional filtering, pagination, and sorting
 * @access  Private (requires JWT token)
 * @query   status - Filter by status (active, on hold, completed)
 * @query   search - Search by name or assigned team member
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   sortField - Field to sort by (name, status, deadline, assigned_team_member, budget, created_at)
 * @query   sortDirection - Sort direction (asc, desc)
 */
router.get('/', projectController.getAllProjects);

/**
 * @route   GET /api/projects/counts
 * @desc    Get project counts by status (for status badges)
 * @access  Private (requires JWT token)
 */
router.get('/counts', projectController.getProjectCounts);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a single project by ID
 * @access  Private (requires JWT token)
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (requires JWT token)
 * @body    { name, status, deadline, assigned_team_member, budget }
 */
router.post('/', projectController.createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update an existing project
 * @access  Private (requires JWT token)
 * @body    { name, status, deadline, assigned_team_member, budget }
 */
router.put('/:id', projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (requires JWT token)
 */
router.delete('/:id', projectController.deleteProject);

module.exports = router;

