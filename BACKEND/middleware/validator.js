function validateBody(requiredFields) {
    return (req, res, next) => {
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: `Missing required body fields: ${missingFields.join(', ')}`
            });
        }

        next();
    };
}

module.exports = {
    validateBody
};
