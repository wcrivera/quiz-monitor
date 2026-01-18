// ============================================================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { verifyJWT, JWTPayload } from '../utils/jwt';

// Extender Request para incluir datos del usuario
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      courseId?: string;
      sessionId?: string;
      userToken?: JWTPayload;
    }
  }
}

/**
 * Middleware para validar JWT en rutas API
 */
export const validateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    console.log('🔍 Validando JWT token...');

    // 1. Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.error('❌ No Authorization header');
      res.status(401).json({
        ok: false,
        error: 'No authorization token provided'
      });
      return;
    }

    // 2. Validar formato "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.error('❌ Formato de Authorization header inválido');
      res.status(401).json({
        ok: false,
        error: 'Invalid authorization format. Use: Bearer <token>'
      });
      return;
    }

    const token = parts[1];

    // 3. Verificar y decodificar JWT
    const decoded = verifyJWT(token);

    // 4. Adjuntar datos al request para uso en controllers
    req.userId = decoded.userId;
    req.courseId = decoded.courseId;
    req.sessionId = decoded.sessionId;
    req.userToken = decoded;

    console.log('✅ JWT válido');
    console.log('   📝 userId:', decoded.userId);
    console.log('   📝 courseId:', decoded.courseId);
    console.log('   📝 sessionId:', decoded.sessionId);

    next();

  } catch (error) {
    console.error('❌ Error validando JWT:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
    
    res.status(401).json({
      ok: false,
      error: errorMessage
    });
  }
};

/**
 * Middleware opcional para validar JWT (no falla si no hay token)
 */
export const validateJWTOptional = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No hay token, continuar sin autenticación
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const decoded = verifyJWT(token);
      
      req.userId = decoded.userId;
      req.courseId = decoded.courseId;
      req.sessionId = decoded.sessionId;
      req.userToken = decoded;
    }

    next();

  } catch (error) {
    // Si hay error, continuar sin autenticación
    console.warn('⚠️ JWT validation failed (optional):', error);
    next();
  }
};