// ============================================================================
// ROUTES - LTI CANVAS CONTENT VIEWER CON JWT
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { validateJWT } from '../middleware/jwtAuth';
import { handleLaunch } from '../controllers/ltiController';
import { obtenerCurso } from '../controllers/curso';
import { obtenerUsuario } from '../controllers/usuario';
import { obtenerCapitulosCurso } from '../controllers/capitulo';
import { obtenerClasesCurso } from '../controllers/clase';
import { obtenerTemasCapitulo } from '../controllers/tema';
import { obtenerAyudantiasCapitulo } from '../controllers/ayudantia';
import { obtenerEjerciciosCapitulo } from '../controllers/ejercicio';

const router = Router();

// ============================================================================
// HEALTH CHECK (Sin autenticación)
// ============================================================================
router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    message: 'LTI Canvas Content Viewer Backend is running',
    timestamp: new Date().toISOString(),
    jwtEnabled: true
  });
});

// ============================================================================
// LTI ROUTES (Validación LTI OAuth)
// ============================================================================
router.post('/lti/launch', validateLTILaunch, handleLaunch);

// ============================================================================
// API ROUTES - CONTENT (PROTEGIDAS CON JWT)
// ============================================================================

// FASE 1: Aplicar validateJWT a TODAS las rutas /api/*
// Esto asegura que todas las rutas API requieran un token JWT válido

// Usuario
router.get('/api/usuario/obtener/:curso_id/:user_id', validateJWT, obtenerUsuario);

// Curso
router.get('/api/curso/obtener/:curso_id', validateJWT, obtenerCurso);

// Capítulos
router.get('/api/capitulo/obtener/:curso_id', validateJWT, obtenerCapitulosCurso);

// Clases
router.get('/api/clase/obtener/:curso_id', validateJWT, obtenerClasesCurso);

// Temas
router.get('/api/tema/obtener/:capitulo_id', validateJWT, obtenerTemasCapitulo);

// Ayudantias
router.get('/api/ayudantia/obtener/:capitulo_id', validateJWT, obtenerAyudantiasCapitulo);

// Ejercicios
router.get('/api/ejercicio/obtener/:capitulo_id', validateJWT, obtenerEjerciciosCapitulo);

export default router;