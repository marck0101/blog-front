import { useEffect, useState } from "react";

// Menu nativo só em telas de toque (no desktop o do navegador é ruim)
const hasNativeShare = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.share === "function" &&
  window.matchMedia("(pointer: coarse)").matches;
import { Check, Facebook, Link2, Linkedin, Mail, MessageCircle, Send, Share2 } from "lucide-react";
import { networkUrl, recordShare, shareUrl } from "../../utils/share";

// "X" sem ícone de marca no lucide: a letra resolve
const XIcon = ({ size = 16 }) => (
  <span aria-hidden="true" className="font-bold leading-none" style={{ fontSize: size }}>
    𝕏
  </span>
);

const NETWORKS = [
  { channel: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { channel: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { channel: "x", label: "X", Icon: XIcon },
  { channel: "facebook", label: "Facebook", Icon: Facebook },
  { channel: "telegram", label: "Telegram", Icon: Send },
  { channel: "email", label: "Email", Icon: Mail },
];

const buttonClass =
  "inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400 transition";

/**
 * Compartilhar o post. Cada canal leva um link com UTM próprio
 * (utm_source=<canal>&utm_medium=share), então dá para ver no painel quantos
 * compartilharam e quantas visitas cada canal trouxe.
 * location: onde estão os botões ("post_top" | "post_bottom"), vai para o GA4.
 */
export default function ShareButtons({ post, location = "post", title = "Compartilhar" }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare] = useState(hasNativeShare);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copyLink = async () => {
    const url = shareUrl(post.slug, "copy");
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copie o link:", url);
    }
    setCopied(true);
    recordShare(post, "copy", location);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: post.title, url: shareUrl(post.slug, "native") });
      recordShare(post, "native", location);
    } catch {
      /* cancelado pela pessoa */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-1">{title}</span>

      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={buttonClass} aria-label="Compartilhar" title="Compartilhar">
          <Share2 size={16} />
        </button>
      )}

      {NETWORKS.map((network) => (
        <a
          key={network.channel}
          href={networkUrl(network.channel, { url: shareUrl(post.slug, network.channel), title: post.title })}
          target={network.channel === "email" ? undefined : "_blank"}
          rel="noopener noreferrer"
          onClick={() => recordShare(post, network.channel, location)}
          className={buttonClass}
          aria-label={`Compartilhar no ${network.label}`}
          title={network.label}
        >
          <network.Icon size={16} />
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        className={`${buttonClass} ${copied ? "text-green-600 border-green-300 dark:text-green-400" : ""}`}
        aria-label={copied ? "Link copiado" : "Copiar link"}
        title={copied ? "Link copiado" : "Copiar link"}
      >
        {copied ? <Check size={16} /> : <Link2 size={16} />}
      </button>
      <span role="status" className="sr-only">{copied ? "Link copiado" : ""}</span>
    </div>
  );
}
