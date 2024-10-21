const User = require('../models/user.model')
const Assignment = require('../models/assignment.model')

const createAssignment = async (req, res) => {
    try {
        const { task, assignedAdmins } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (user.isAdmin) {
            return res.status(403).json({ error: "Admins cannot create assignments" })
        }
        const admins = await User.find({
            username: { $in: assignedAdmins },
            isAdmin: true,
        });

        if (admins.length !== assignedAdmins.length) {
            return res.status(400).json({ error: "Admin usernames are invalid or Users aren't admin" })
        }
        const adminIds = admins.map((admin) => admin._id);
        const newAssignment = new Assignment({
            userId,
            task,
            assignedAdmins: adminIds,
        })
        await newAssignment.save();

        const populatedAssignment = await Assignment.findById(newAssignment._id)
            .populate("userId", "fullName username")
            .select("-_v -updatedAt")
            .populate("assignedAdmins", "fullName username")

        res.status(201).json(populatedAssignment);

    } catch (error) {
        console.log("Error in createAssignment controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const updateAssignment = async (req, res) => {
    try {
        const { id: assignmentId } = req.params;
        const userId = req.user._id;
        const { task, assignedAdmins } = req.body;
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" })
        }

        if (assignment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "You are not authorized to update this assignment" })
        }

        let adminIds = [];
        if (assignedAdmins && assignedAdmins.length > 0) {
            const admins = await User.find({
                username: { $in: assignedAdmins },
                isAdmin: true,
            });

            if (admins.length !== assignedAdmins.length) {
                return res.status(400).json({ error: "Admins or usernames are invalid or Users aren't admins" });
            }
            adminIds = admins.map((admin) => admin._id);
        }
        assignment.task = task || assignment.task;
        if (adminIds.length > 0) {
            assignment.assignedAdmins = adminIds;
        }
        await assignment.save();
        const updatedAssignment = await Assignment.findById(assignmentId)
            .populate("userId", "fullName username")
            .select("-_v")
            .populate("assignedAdmins", "fullName username")

        res.status(200).json(updatedAssignment)
    } catch (error) {
        console.log("Error in updateAssignment controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const deleteAssignment = async (req, res) => {
    try {
        const { id: assignmentId } = req.params;
        const userId = req.user._id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        if (assignment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this assignment" });
        }

        await Assignment.findByIdAndDelete(assignmentId);

        res.status(200).json({ message: "Assignment deleted successfully" })
    } catch (error) {
        console.log("Error in deleteAssignment controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getAssignments = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        let assignments;
        if (user.isAdmin) {
            assignments = await Assignment.find({
                assignedAdmins: userId,
            })
                .populate("userId", "fullName username")
                .select("-__v -isAdmin -updateAt -assignedAdmins")
        }
        else {
            assignments = await Assignment.find({
                userId: userId,
            })
                .populate("assignedAdmins", "fullName username")
                .select("-__v -isAdmin -updatedAt")
                .sort({ createdAt: -1 })
        }
        res.status(200).json(assignments);

    } catch (error) {
        console.log("Error in getAssignments controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const acceptAssigment = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;
        const { feedback } = req.body;

        const assignment = await Assignment.findOne({
            _id: id,
            assignedAdmins: adminId
        })

        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found or you aren't authorized user" })
        }

        assignment.status = "accepted"
        if (feedback) {
            assignment.feedback = feedback
        }

        await assignment.save();
        const updatedAssignment = await Assignment.findById(id)
            .populate("userId", "fullName username")
            .populate("assignedAdmins", "fullName username")

        res.status(200).json(updatedAssignment);

    } catch (error) {
        console.log("Error in acceptAssignment controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const rejectAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;
        const { feedback } = req.body;

        const assignment = await Assignment.findOne({
            _id: id,
            assignedAdmins: adminId,
        });
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found or you're not authorized" })
        }

        if (!feedback) {
            return res.status(400).json({ error: "Feedback is required when rejecting as assigment" })
        }

        assignment.status = "rejected";
        assignment.feedback = feedback;

        await assignment.save();

        const updatedAssignment = await Assignment.findById(id)
            .populate("userId", "fullName username")
            .populate("assignedAdmins", "fullName username")

        res.status(200).json(updatedAssignment);

    } catch (error) {
        console.log("Error in rejectAssignment controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignments,
    acceptAssigment,
    rejectAssignment
}