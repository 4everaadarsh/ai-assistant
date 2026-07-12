function errorHandler(err, req, res, next) {
    console.error(`[Error Handler] Error occurred during ${req.method} ${req.url}:`);
    console.error(err.stack || err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        // Only show stack trace in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;
