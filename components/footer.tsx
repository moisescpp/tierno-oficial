import { Github, Instagram, Facebook, Heart, CheckCircle, AlertCircle } from "lucide-react"

interface FooterProps {
  isConnected: boolean
}

export function Footer({ isConnected }: FooterProps) {
  return (
    <footer className="mt-12 border-t bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Información del desarrollador */}
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Desarrollado por Moises Camilo Perez Prieto</h3>
            <p className="text-sm text-gray-600 flex items-center justify-center lg:justify-start gap-1">
              Hecho con <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" /> para optimizar tu negocio
            </p>
          </div>

          {/* Redes sociales */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">Sígueme en:</span>
            <div className="flex gap-3">
              <a
                href="https://github.com/moisescpp"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-800 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-sm hover:shadow-md"
                title="GitHub - Moises Camilo"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/moises26__"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-gray-100 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-sm hover:shadow-md"
                title="Instagram - @moises26__"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/moises.perez.927399"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-gray-100 hover:bg-blue-600 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-sm hover:shadow-md"
                title="Facebook - Moisés Pérez"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Línea divisoria y información adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 mb-1">
                © 2025 Sistema de Gestión de Entregas y Pedidos. Todos los derechos reservados.
              </p>
              <p className="text-xs text-gray-400">
                Aplicación web diseñada para optimizar la gestión de pedidos y entregas
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Versión 2.0</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">Modo Local</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje motivacional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 italic">"La tecnología al servicio de tu emprendimiento" 🚀</p>
        </div>
      </div>
    </footer>
  )
}
