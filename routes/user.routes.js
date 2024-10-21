const express = require('express')
const protectRoute = require('../middleware/protectRoute')
const { getAllAdmins } = require("../controllers/user.controller")
const router = express.Router();

router.get("/admin", protectRoute, getAllAdmins)

module.exports = router;