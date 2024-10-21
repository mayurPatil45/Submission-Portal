const mongoose = require('mongoose')

const assignmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    task: {
        type: String,
        required: true,
    },
    assignedAdmins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },],
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    feedback: {
        type: String,
        default: "",
    },
},
    {
        timestamps: true,
    }
)

const Assignment = mongoose.model("Assignment", assignmentSchema);
module.exports = Assignment;