const bcrypt = require('bcryptjs')
const User = require("../models/user.model")
const generateTokenAndSetCookie = require('../utils/generateToken')

const register = async (req, res) => {
    try {
        const { fullName, username, password, confirmPassword, isAdmin } = req.body;
        if (!fullName || !username || !password || !confirmPassword || !isAdmin) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords don't match" })
        }

        const user = await User.findOne({ username })
        if (user) {
            return res.status(400).json({ error: "Username already exists" })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            fullName,
            username,
            password: hashedPassword,
            isAdmin,
        });
        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                isAdmin: newUser.isAdmin
            });
        }
        else {
            res.status(400).json({ error: "Invalid user data" })
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" })
        }
        generateTokenAndSetCookie(user._id, res);
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            isAdmin: user.isAdmin,
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {register, login, logout};