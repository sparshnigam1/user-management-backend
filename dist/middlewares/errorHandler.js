export class ApiError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
export function notFoundHandler(req, res) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err, req, res, next) {
    const isApiError = err instanceof ApiError;
    const statusCode = isApiError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    // Postgres unique_violation
    const pgCode = err?.code;
    if (pgCode === '23505') {
        res.status(409).json({ error: 'A record with this value already exists.' });
        return;
    }
    if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.error(err);
    }
    res.status(statusCode).json({ error: message });
}
//# sourceMappingURL=errorHandler.js.map