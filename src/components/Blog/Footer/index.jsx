import { Link } from "react-router-dom";
import { Linkedin, Github, MessageCircle } from "lucide-react";
import authorPhoto from "../../../assets/author.webp";

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/marcos-henrique-corrêa-618392209/",
    icon: Linkedin,
    hoverColor: "hover:text-[#0077B5]",
  },
  {
    label: "GitHub",
    url: "https://github.com/marck0101",
    icon: Github,
    hoverColor: "hover:text-gray-900 dark:hover:text-gray-100",
  },
  {
    label: "WhatsApp",
    url: "https://wa.me/5555963370494",
    icon: MessageCircle,
    hoverColor: "hover:text-[#25D366]",
  },
];

const QUICK_LINKS = [
  { label: "Início", to: "/blog" },
  { label: "Blog", to: "/blog" },
  { label: "Privacidade", to: "/privacidade" },
];

export default function BlogFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Coluna esquerda — logo + descrição */}
        <div>
          <div className="flex items-center gap-3">
            <img
              src={authorPhoto}
              alt="Marcos Henrique"
              className="w-10 h-10 rounded-full object-cover object-top shrink-0"
            />
            <Link
              to="/blog"
              className="font-bold text-lg text-gray-900 dark:text-gray-100"
            >
              marck0101
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-3 leading-relaxed">
            Blog do Marcos Henrique sobre marketing digital, tráfego pago e
            growth. Estratégias práticas para quem quer resultados reais.
          </p>
        </div>

        {/* Coluna central — links rápidos */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-300 mb-4">
            Navegação
          </h3>
          <ul className="space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="#assinar"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Assinar newsletter
              </a>
            </li>
          </ul>
        </div>

        {/* Coluna direita — redes sociais */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-300 mb-4">
            Redes sociais
          </h3>
          <ul className="space-y-3">
            {SOCIAL_LINKS.map(({ label, url, icon: Icon, hoverColor }) => (
              <li key={label}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300 ${hoverColor} transition`}
                >
                  <Icon size={20} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center text-xs text-gray-400 dark:text-gray-300">
          © {year} marck0101 · Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
