'use strict';
const logger   = require('../lib/logger');
const router   = require('express').Router();
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { signAccess, signRefresh, storeRefreshToken } = require('./auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL  = process.env.BACKEND_URL  || `http://localhost:${process.env.PORT || 9000}`;
const GOOGLE_CONFIGURED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// passport.initialize() solo se monta en ESTE router (no en toda la app) —
// con session:false en authenticate() no hace falta passport.session() ni
// express-session: el perfil de Google llega en req.user para esta request
// nada más, no se persiste en ningún lado vía passport.
router.use(passport.initialize());

if (GOOGLE_CONFIGURED) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${BACKEND_URL}/api/auth/google/callback`,
    },
    // No hay usuario de la app todavía en este punto (puede ser signup nuevo) —
    // se pasa el profile de Google tal cual; la búsqueda/creación real pasa en
    // el handler de /google/callback, con acceso a req.prisma.
    (_accessToken, _refreshToken, profile, done) => done(null, profile),
  ));
} else {
  logger.warn('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET no configurados — Google OAuth deshabilitado');
}

function requireGoogleConfigured(req, res, next) {
  if (!GOOGLE_CONFIGURED) {
    return res.status(503).json({ error: 'Google OAuth no está configurado en este servidor' });
  }
  next();
}

// GET /api/auth/google — inicia el flujo, redirige a la pantalla de consentimiento de Google
router.get('/google', requireGoogleConfigured, passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// GET /api/auth/google/callback — Google redirige aquí con el resultado
router.get(
  '/google/callback',
  requireGoogleConfigured,
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, profile) => {
      if (err || !profile) {
        logger.warn({ err }, 'Google OAuth: callback sin perfil válido');
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      }
      req.user = profile;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const profile = req.user;
      const email = profile?.emails?.[0]?.value?.toLowerCase().trim();
      if (!email) {
        logger.warn('Google OAuth: el perfil no trajo ningún email');
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_email`);
      }
      const displayName = profile.displayName || email;
      const googleId     = profile.id;

      // Búsqueda global por email — a diferencia del login con password
      // (@@unique([email, restaurante_id]), scoped por tenant), "Continuar
      // con Google" no sabe a qué restaurante pertenece el usuario todavía,
      // así que busca la primera coincidencia en cualquier tenant.
      let usuario = await req.prisma.usuario.findFirst({ where: { email, activo: true } });
      let restaurante;

      if (usuario) {
        restaurante = await req.prisma.restaurante.findUnique({ where: { id: usuario.restaurante_id } });
      } else {
        // Sin cuenta previa con ese email → signup nuevo vía Google.
        // Mismo patrón que POST /api/auth/signup: crea Restaurante + Usuario
        // admin en una transacción, plan trial de 14 días.
        const baseSlug = displayName
          .toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'restaurante';
        const existingSlug = await req.prisma.restaurante.findFirst({
          where: { slug: { startsWith: baseSlug } }, orderBy: { id: 'desc' },
        });
        const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        // Usuario.password_hash es NOT NULL en el schema — no se agregó la
        // columna como nullable para este cambio. Se guarda un hash de un
        // valor aleatorio que nadie conoce: el login con password queda
        // deshabilitado de hecho para esta cuenta sin tocar el schema.
        const randomPasswordHash = bcrypt.hashSync(crypto.randomUUID(), 12);

        const created = await req.prisma.$transaction(async (tx) => {
          const r = await tx.restaurante.create({
            data: { nombre: displayName, slug, plan: 'trial', trial_ends_at: trialEndsAt },
          });
          const u = await tx.usuario.create({
            data: {
              nombre: displayName, email, password_hash: randomPasswordHash,
              rol: 'admin', restaurante_id: r.id,
              oauth_provider: 'google', oauth_id: googleId,
            },
          });
          return { restaurante: r, usuario: u };
        });
        restaurante = created.restaurante;
        usuario     = created.usuario;
      }

      const payload = {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol,
        restaurante_id: usuario.restaurante_id,
        plan:          restaurante?.plan || 'trial',
        plan_status:   restaurante?.plan_status || 'active',
        trial_ends_at: restaurante?.trial_ends_at ? restaurante.trial_ends_at.toISOString() : null,
      };
      // Mismo mecanismo que /login y /signup en auth.js: access token corto +
      // refresh token (~7 días, JWT_REFRESH_EXPIRES) guardado hasheado en
      // Metadata vía storeRefreshToken — nada nuevo, se reusan las mismas
      // funciones para que /api/auth/refresh funcione igual con una sesión
      // iniciada por Google.
      const token = signAccess(payload);
      const refreshToken = signRefresh(payload);
      await storeRefreshToken(req.prisma, usuario.id, refreshToken);

      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&refresh=${refreshToken}`);
    } catch (e) {
      const errCode = e.code ?? e.cause?.code ?? e.meta?.cause;
      logger.error({ err: e, errCode }, 'Google OAuth callback error');
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  },
);

module.exports = router;
