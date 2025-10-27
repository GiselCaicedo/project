import jwt from 'jsonwebtoken';
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    const cookieToken = req.cookies?.auth_token;
    return cookieToken ?? null;
}
export function authenticate(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        return next();
    }
    catch (error) {
        console.error('Error validando token JWT:', error);
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}
