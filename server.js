const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const expressWinston = require('express-winston');
const compression = require('compression');
const connectDB = require('./db/connectToMongoDB');

// Routes
const authRoute = require('./routes/authRoute');
// const userRoute = require('./routes/userRoute');
const assignmentRoute = require('./routes/assignmentRoute');

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Initialize Express app
const app = express();

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Middleware stack
// Security middleware
app.use(helmet()); // Helps secure Express apps by setting various HTTP headers

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*', // Specify allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.MAX_REQUEST_LIMIT || 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Parsing middleware
app.use(express.json({
    limit: '10kb'
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    colorize: false
}));

// Routes
app.get('/', (req, res) => {
    res.status(200).send("Server is running...");
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/assignments", assignmentRoute);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
    });
});

// Error logging middleware
app.use(expressWinston.errorLogger({
    winstonInstance: logger
}));

// Global error handler
app.use((err, req, res, next) => {
    logger.error(err.stack);

    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Received shutdown signal, closing server gracefully');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown();
});