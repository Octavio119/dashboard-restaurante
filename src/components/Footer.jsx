const WebIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 18c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3M3.5 9h17M3.5 15h17" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.405a.75.75 0 00.921.921l5.56-1.474A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.953 9.953 0 01-5.127-1.42l-.367-.216-3.8 1.007 1.007-3.8-.216-.367A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
  </svg>
);

const EmailIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="sf-root" role="contentinfo">
      <div className="sf-inner">

        {/* ── Columna 1: Marca ── */}
        <div className="sf-col">
          <a href="/" className="sf-logo" aria-label="MastexoPOS inicio">
            <span className="sf-logo-accent">Mastexo</span>POS
          </a>
          <p className="sf-tagline">Sistema POS para restaurantes en LatAm</p>
          <p className="sf-copy">© 2026 MastexoPOS</p>
        </div>

        {/* ── Columna 2: Producto ── */}
        <div className="sf-col">
          <h3 className="sf-heading">Producto</h3>
          <ul className="sf-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Precios</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="/login">Iniciar sesión</a></li>
            <li><a href="/register" className="sf-link-cta">Empezar gratis</a></li>
          </ul>
        </div>

        {/* ── Columna 3: Contacto ── */}
        <div className="sf-col">
          <h3 className="sf-heading">Contacto</h3>
          <ul className="sf-contact">
            <li>
              <a href="https://www.mastexo.com/" target="_blank" rel="noopener noreferrer">
                <WebIcon />
                www.mastexo.com
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/56929709420?text=Hola%20Mastexo%2C%20quiero%20saber%20m%C3%A1s%20sobre%20sus%20servicios"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                +56 9 2970 9420
              </a>
            </li>
            <li>
              <a href="mailto:farahfo4715@gmail.com">
                <EmailIcon />
                farahfo4715@gmail.com
              </a>
            </li>
            <li>
              <a href="mailto:infra@mastexo.com">
                <EmailIcon />
                Soporte: infra@mastexo.com
              </a>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
