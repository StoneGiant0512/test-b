const { pool } = require('../config/database');

/**
 * Get all projects from the database with pagination
 * @param {Object} filters - Optional filters (status, search, page, limit)
 * @returns {Promise<Object>} Object with data (array of projects) and pagination metadata
 */
const getAllProjects = async (filters = {}) => {
  try {
    // Build base WHERE clause for filtering
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Filter by status if provided
    if (filters.status && filters.status !== 'all') {
      whereClause += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    // Search by name or assigned team member if provided
    if (filters.search) {
      whereClause += ` AND (name ILIKE $${paramCount} OR assigned_team_member ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Pagination parameters
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    // Sort parameters - validate against allowed fields
    const validSortFields = ['name', 'status', 'deadline', 'assigned_team_member', 'budget', 'created_at'];
    const sortField = validSortFields.includes(filters.sortField) ? filters.sortField : 'created_at';
    const sortDirection = filters.sortDirection === 'desc' ? 'DESC' : 'ASC';

    // Get total count of projects matching filters
    const countQuery = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated projects with sorting
    // Note: sortField is validated above, so it's safe to use in ORDER BY
    const dataQuery = `
      SELECT * FROM projects 
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await pool.query(dataQuery, dataParams);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Get total count of projects by status (for status badges)
 * @returns {Promise<Object>} Object with counts by status
 */
const getProjectCounts = async () => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM projects
      GROUP BY status
    `;
    const result = await pool.query(query);
    
    // Initialize counts
    const counts = {
      all: 0,
      active: 0,
      'on hold': 0,
      completed: 0,
    };

    // Sum up all counts for 'all'
    result.rows.forEach((row) => {
      const status = row.status;
      const count = parseInt(row.count);
      counts.all += count;
      if (counts.hasOwnProperty(status)) {
        counts[status] = count;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error fetching project counts:', error);
    throw error;
  }
};

/**
 * Get a single project by ID
 * @param {number} id - Project ID
 * @returns {Promise<Object>} Project object
 */
const getProjectById = async (id) => {
  try {
    const query = 'SELECT * FROM projects WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    throw error;
  }
};

/**
 * Create a new project
 * @param {Object} projectData - Project data (name, status, deadline, assigned_team_member, budget)
 * @returns {Promise<Object>} Created project object
 */
const createProject = async (projectData) => {
  try {
    const { name, status, deadline, assigned_team_member, budget } = projectData;
    
    const query = `
      INSERT INTO projects (name, status, deadline, assigned_team_member, budget)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [name, status, deadline, assigned_team_member, budget];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Update an existing project
 * @param {number} id - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Promise<Object>} Updated project object
 */
const updateProject = async (id, projectData) => {
  try {
    const { name, status, deadline, assigned_team_member, budget } = projectData;
    
    const query = `
      UPDATE projects
      SET name = $1,
          status = $2,
          deadline = $3,
          assigned_team_member = $4,
          budget = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [name, status, deadline, assigned_team_member, budget, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

/**
 * Delete a project by ID
 * @param {number} id - Project ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
const deleteProject = async (id) => {
  try {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectCounts,
};

