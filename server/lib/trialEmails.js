'use strict';
const cron = require('node-cron');
const prisma = require('./prisma');
const logger = require('./logger');
const { sendWelcomeEmail, sendTrialWarningEmail, sendTrialExpiredEmail } = require('./email');

const DAY_MS = 24 * 60 * 60 * 1000;

async function alreadySent(key) {
  const row = await prisma.metadata.findUnique({ where: { key } });
  return Boolean(row);
}

async function markSent(key) {
  // create (no upsert) — si ya existiera, es una carrera entre dos corridas del
  // cron y queremos que falle en vez de reenviar; el catch de arriba lo absorbe.
  await prisma.metadata.create({ data: { key, value: new Date().toISOString() } });
}

// Sin req de por medio (es un cron, no una request HTTP) — lib/prisma.js no
// aplica ningún filtro de tenant cuando no hay contexto seteado, así que esta
// query global recorre restaurantes de TODOS los tenants a propósito.
async function checkTrialEmails() {
  const restaurantes = await prisma.restaurante.findMany({
    where: { plan: 'trial', trial_ends_at: { not: null } },
    include: {
      usuarios: { where: { rol: 'admin', activo: true }, take: 1, orderBy: { id: 'asc' } },
    },
  });

  for (const r of restaurantes) {
    const admin = r.usuarios[0];
    if (!admin) continue; // sin usuario admin activo, no hay a quién mandarle el email

    const diasRestantes = (r.trial_ends_at.getTime() - Date.now()) / DAY_MS;

    try {
      if (diasRestantes >= 13 && diasRestantes < 14) {
        const key = `email_sent:welcome:${r.id}`;
        if (!(await alreadySent(key))) {
          await sendWelcomeEmail(admin.email, admin.nombre, r.nombre);
          await markSent(key);
          logger.info({ restauranteId: r.id }, 'trialEmails: welcome enviado');
        }
      } else if (diasRestantes <= 3 && diasRestantes > 0) {
        const key = `email_sent:warning:${r.id}`;
        if (!(await alreadySent(key))) {
          await sendTrialWarningEmail(admin.email, admin.nombre, Math.ceil(diasRestantes));
          await markSent(key);
          logger.info({ restauranteId: r.id }, 'trialEmails: warning enviado');
        }
      } else if (diasRestantes <= 0) {
        const key = `email_sent:expired:${r.id}`;
        if (!(await alreadySent(key))) {
          await sendTrialExpiredEmail(admin.email, admin.nombre);
          await markSent(key);
          logger.info({ restauranteId: r.id }, 'trialEmails: expired enviado');
        }
      }
    } catch (e) {
      logger.error({ err: e, restauranteId: r.id }, 'trialEmails: error procesando restaurante');
    }
  }
}

// 9:00 AM hora Chile todos los días. America/Santiago (no un offset fijo
// UTC-4) para que node-cron ajuste solo el cambio de horario de verano.
cron.schedule('0 9 * * *', () => {
  checkTrialEmails().catch(e => logger.error({ err: e }, 'trialEmails: checkTrialEmails falló'));
}, { timezone: 'America/Santiago' });

logger.info('trialEmails: cron de emails de trial programado (9:00 AM America/Santiago)');

module.exports = { checkTrialEmails };
