// ============================================================================
// OAUTH 1.0 SIGNATURE GENERATION
// ============================================================================

import crypto from 'crypto';

export const generateSignature = (
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string
): string => {
  // 1. Ordenar parámetros alfabéticamente
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // 2. Crear base string
  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // 3. Crear signing key (consumer_secret&token_secret, pero token_secret está vacío)
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  // 4. Generar signature con HMAC-SHA1
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  return signature;
};
