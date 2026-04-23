const crypto = require('crypto');
const { runWithContext } = require('../lib/context');

module.exports = function apiKeyAuth(req, res, next) {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) return res.status(401).json({ error: 'X-API-Key requerido' });

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  req.prisma.apiKey.findUnique({
    where:   { key_hash: keyHash },
    include: { restaurante: { select: { id: true, plan: true, activo: true, nombre: true } } },
  }).then((apiKey) => {
    if (!apiKey || !apiKey.activo) {
      return res.status(401).json({ error: 'API Key inválida o desactivada' });
    }
    if (!apiKey.restaurante.activo) {
      return res.status(403).json({ error: 'Restaurante inactivo' });
    }
    if (apiKey.restaurante.plan !== 'business') {
      return res.status(403).json({
        error:          'plan_required',
        feature:        'api_keys',
        plan_actual:    apiKey.restaurante.plan,
        plan_requerido: 'business',
        upgrade_url:    '/billing',
      });
    }

    req.user = {
      id:             0,
      nombre:         `API Key: ${apiKey.nombre}`,
      email:          '',
      rol:            'api',
      restaurante_id: apiKey.restaurante.id,
    };

    runWithContext(apiKey.restaurante.id, () => next());
  }).catch(next);
};
