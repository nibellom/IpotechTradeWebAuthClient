// Простая инициализация GA4 + отправка page_view для SPA
export function initGA() {
    const id = import.meta.env.VITE_GA_ID
    if (!id || !import.meta.env.PROD) return // в dev не грузим (по желанию)
  
    // уже загружено?
    if (window.__gaInitialized) return
    window.__gaInitialized = true
  
    // загрузка gtag.js
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
    document.head.appendChild(s)
  
    // dataLayer + базовая инициализация
    window.dataLayer = window.dataLayer || []
    window.gtag = function(){ window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    // включим анонимизацию IP; отправим первый config
    window.gtag('config', id, { anonymize_ip: true })
  }
  
  export function sendPageview(path) {
    const id = import.meta.env.VITE_GA_ID
    if (!id || typeof window.gtag !== 'function') return
    window.gtag('config', id, { page_path: path })
  }
  
  // Пример кастомного события
  export function gaEvent({ action, category, label, value }) {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value
    })
  }
  