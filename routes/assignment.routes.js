const express = require('express')
const protectRoute = require('../middleware/protectRoute')

const {
    acceptAssignment,
    createAssignment,
    deleteAssignment,
    getAssignments,
    rejectAssignment,
    updateAssignment
} = require('../controllers/assignment.controller')

const router = express.Router();

router.get('/', protectRoute, getAssignments)
router.post('/create', protectRoute, createAssignment)
router.post("/update/:id", protectRoute, updateAssignment)
router.post("/delete/:id", protectRoute, deleteAssignment)
router.post("/accept/:id", protectRoute, acceptAssignment)
router.post("/reject/:id", protectRoute, rejectAssignment)

module.exports = router;