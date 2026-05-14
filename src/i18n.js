import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// ── ES ──────────────────────────────────────────────────────────────
import esCommon    from './locales/es/common.json'
import esDashboard from './locales/es/dashboard.json'
import esOrders    from './locales/es/orders.json'
import esKitchen   from './locales/es/kitchen.json'
import esTables    from './locales/es/tables.json'
import esInventory from './locales/es/inventory.json'
import esCheckout  from './locales/es/checkout.json'

// ── EN ──────────────────────────────────────────────────────────────
import enCommon    from './locales/en/common.json'
import enDashboard from './locales/en/dashboard.json'
import enOrders    from './locales/en/orders.json'
import enKitchen   from './locales/en/kitchen.json'
import enTables    from './locales/en/tables.json'
import enInventory from './locales/en/inventory.json'
import enCheckout  from './locales/en/checkout.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common:    esCommon,
        dashboard: esDashboard,
        orders:    esOrders,
        kitchen:   esKitchen,
        tables:    esTables,
        inventory: esInventory,
        checkout:  esCheckout,
      },
      en: {
        common:    enCommon,
        dashboard: enDashboard,
        orders:    enOrders,
        kitchen:   enKitchen,
        tables:    enTables,
        inventory: enInventory,
        checkout:  enCheckout,
      },
    },
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'orders', 'kitchen', 'tables', 'inventory', 'checkout'],
    detection: {
      // Check localStorage first (user preference), then browser language
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'mastexo_lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

export default i18n
