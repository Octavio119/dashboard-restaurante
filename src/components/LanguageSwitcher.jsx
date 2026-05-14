import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

/**
 * Toggle ES | EN with instant language switch + localStorage persistence.
 * Designed for MastexoPOS dark theme. Fits inside the header bar.
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const isEN = i18n.language?.startsWith('en')

  function toggle() {
    const next = isEN ? 'es' : 'en'
    i18n.changeLanguage(next)
    // i18next-browser-languagedetector already writes 'mastexo_lang' via
    // caches config, but we write it explicitly for immediate reads.
    localStorage.setItem('mastexo_lang', next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={isEN ? 'Switch to Spanish' : 'Cambiar a Inglés'}
      title={isEN ? 'Switch to Spanish' : 'Cambiar a Inglés'}
      className="relative flex items-center h-7 rounded-full border cursor-pointer select-none"
      style={{
        width: '68px',
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        padding: '0 2px',
      }}
    >
      {/* Sliding pill */}
      <motion.div
        aria-hidden="true"
        layout
        transition={{ type: 'spring', stiffness: 480, damping: 38 }}
        className="absolute h-[22px] w-[31px] rounded-full pointer-events-none"
        style={{
          left: isEN ? '33px' : '2px',
          background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
          boxShadow: '0 0 10px rgba(139,92,246,0.45)',
        }}
      />

      <span
        className="relative z-10 flex-1 text-center font-bold transition-colors duration-200"
        style={{
          fontSize: '10px',
          letterSpacing: '0.04em',
          color: !isEN ? '#fff' : '#50506A',
        }}
      >
        ES
      </span>
      <span
        className="relative z-10 flex-1 text-center font-bold transition-colors duration-200"
        style={{
          fontSize: '10px',
          letterSpacing: '0.04em',
          color: isEN ? '#fff' : '#50506A',
        }}
      >
        EN
      </span>
    </button>
  )
}
