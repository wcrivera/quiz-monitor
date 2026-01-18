// ============================================================================
// JWT UTILITIES
// ============================================================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '2h'; // 2 horas

export interface JWTPayload {
    userId: string;
    courseId: string;
    userName?: string;
    courseName?: string;
    roles?: string;
    sessionId: string;
    iat?: number;
    exp?: number;
}

/**
 * Generar JWT token
 */
export const generateJWT = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
    try {
        const token = jwt.sign(
            payload,
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRATION,
                algorithm: 'HS256'
            }
        );

        console.log('✅ JWT generado exitosamente');
        console.log('   📝 userId:', payload.userId);
        console.log('   📝 courseId:', payload.courseId);
        console.log('   📝 sessionId:', payload.sessionId);

        return token;
    } catch (error) {
        console.error('❌ Error generando JWT:', error);
        throw new Error('Error generating JWT token');
    }
};

/**
 * Verificar y decodificar JWT token
 */
export const verifyJWT = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        console.log('✅ JWT verificado exitosamente');
        console.log('   📝 userId:', decoded.userId);
        console.log('   📝 courseId:', decoded.courseId);

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.error('❌ JWT expirado');
            throw new Error('Token expired');
        }

        if (error instanceof jwt.JsonWebTokenError) {
            console.error('❌ JWT inválido');
            throw new Error('Invalid token');
        }

        console.error('❌ Error verificando JWT:', error);
        throw new Error('Token verification failed');
    }
};

/**
 * Generar session ID único
 */
export const generateSessionId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};