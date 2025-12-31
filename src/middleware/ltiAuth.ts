// ============================================================================
// LTI AUTHENTICATION MIDDLEWARE
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { generateSignature } from '../utils/oauth';

export const validateLTILaunch = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    console.log('🔍 LTI Launch recibido');

    const consumerKey = process.env.LTI_CONSUMER_KEY;
    const consumerSecret = process.env.LTI_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      console.error('❌ LTI credentials no configuradas');
      res.status(500).send('Server configuration error');
      return;
    }

    // Extraer signature del request
    const { oauth_signature, ...paramsWithoutSignature } = req.body;

    if (!oauth_signature) {
      console.error('❌ No oauth_signature en request');
      res.status(401).send('Missing signature');
      return;
    }

    // Construir URL completa para validación
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const path = req.originalUrl || req.url;
    const fullUrl = `${protocol}://${host}${path}`;

    console.log('📍 URL para validación:', fullUrl);
    console.log('📍 Consumer Key:', consumerKey);

    // Generar signature esperada
    const expectedSignature = generateSignature(
      'POST',
      fullUrl,
      paramsWithoutSignature,
      consumerSecret
    );

    console.log('🔐 Firma recibida:', oauth_signature.substring(0, 20) + '...');
    console.log('🔐 Firma esperada:', expectedSignature.substring(0, 20) + '...');

    // Comparar signatures
    if (oauth_signature === expectedSignature) {
      console.log('✅ LTI launch válido - Firma verificada');
      next();
    } else {
      console.error('❌ Firma inválida');
      res.status(401).send('Invalid signature');
    }
  } catch (error) {
    console.error('❌ Error validando LTI launch:', error);
    res.status(500).send('Validation error');
  }
};
