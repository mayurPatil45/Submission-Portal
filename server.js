const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const authRoute = require('./routes/auth.routes')
const userRoute = require('./routes/user.routes')
const assignmentRoute = require('./routes/assignment.routes')

const app = express();

dotenv.config();

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cookieParser());

app.get('/', () => {
    resizeBy.status(200).send("Server is running...");
})

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/assignments", assignmentRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
