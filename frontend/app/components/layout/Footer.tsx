import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">

      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand */}
          <div className="md:col-span-4 space-y-6">
            <div>
              <span className="text-2xl font-black tracking-tight">
                <span className="text-secondary-400">MEDIA</span>
                <span className="text-primary-400">NET</span>
              </span>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mt-1">
                Incubateur & Accélérateur
              </p>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Nous connectons les startups tunisiennes avec des investisseurs stratégiques, des mentors expérimentés et les ressources nécessaires pour bâtir des entreprises durables.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="Twitter / X"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1" />

          {/* Plateforme */}
          <div className="md:col-span-2 space-y-5">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-300">
              Plateforme
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Études de Cas
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Feuille de Route
                </Link>
              </li>
            </ul>
          </div>

          {/* Entreprise */}
          <div className="md:col-span-2 space-y-5">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-300">
              Entreprise
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  À Propos
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Carrières
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Presse
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div className="md:col-span-2 space-y-5">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-300">
              Ressources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Support
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-sm text-gray-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-0 group-hover:w-2 h-px bg-primary-400 transition-all duration-200 inline-block" />
                  Communauté
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} MediaNet Incubator. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-gray-600 hover:text-gray-300 transition-colors duration-150">
              Confidentialité
            </Link>
            <Link href="/terms" className="text-xs text-gray-600 hover:text-gray-300 transition-colors duration-150">
              Conditions
            </Link>
            <Link href="/cookies" className="text-xs text-gray-600 hover:text-gray-300 transition-colors duration-150">
              Cookies
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}