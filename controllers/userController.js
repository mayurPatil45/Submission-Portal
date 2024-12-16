const User = require('../models/user.model')

const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find(
            { isAdmin: true },
            { password: 0 }
        ).select("-_v -isAdmin -createdAt -updatedAt");

        res.status(200).json(admins);
    } catch (error) {
        console.log("Error in getAllAdmins controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {getAllAdmins};