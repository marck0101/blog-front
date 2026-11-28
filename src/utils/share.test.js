import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/posts.service", () => ({ default: { engage: vi.fn() } }));
vi.mock("./analytics", () => ({ trackEvent: vi.fn() }));

import PostsService from "../services/posts.service";
import { trackEvent } from "./analytics";
import { SITE_URL } from "../seo/site";
import { SHARE_CHANNELS, networkUrl, recordShare, recordShareVisit, shareUrl } from "./share";

describe("shareUrl", () => {
  it("monta o link do post com UTM de compartilhamento", () => {
    const url = new URL(shareUrl("meu-post", "whatsapp"));
    expect(`${url.origin}${url.pathname}`).toBe(`${SITE_URL}/blog/meu-post`);
    expect(url.searchParams.get("utm_source")).toBe("whatsapp");
    expect(url.searchParams.get("utm_medium")).toBe("share");
    expect(url.searchParams.get("utm_campaign")).toBe("post-meu-post");
  });
});

describe("networkUrl", () => {
  const data = { url: "https://x.com/p?a=1&b=2", title: "Olá & tchau" };
  const enc = encodeURIComponent;

  it("WhatsApp leva título + link no texto", () => {
    expect(networkUrl("whatsapp", data)).toBe(`https://wa.me/?text=${enc(`${data.title} ${data.url}`)}`);
  });
  it("LinkedIn, Facebook, X e Telegram codificam url e título", () => {
    expect(networkUrl("linkedin", data)).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${enc(data.url)}`);
    expect(networkUrl("facebook", data)).toBe(`https://www.facebook.com/sharer/sharer.php?u=${enc(data.url)}`);
    expect(networkUrl("x", data)).toBe(`https://x.com/intent/post?text=${enc(data.title)}&url=${enc(data.url)}`);
    expect(networkUrl("telegram", data)).toBe(`https://t.me/share/url?url=${enc(data.url)}&text=${enc(data.title)}`);
  });
  it("email vira mailto com assunto e corpo", () => {
    const mail = networkUrl("email", data);
    expect(mail.startsWith(`mailto:?subject=${enc(data.title)}&body=`)).toBe(true);
    expect(decodeURIComponent(mail)).toContain(data.url);
  });
  it("copy, native e desconhecido: sem página própria (null)", () => {
    expect(networkUrl("copy", data)).toBeNull();
    expect(networkUrl("native", data)).toBeNull();
    expect(networkUrl("nada", data)).toBeNull();
  });
});

describe("recordShare", () => {
  beforeEach(() => vi.clearAllMocks());

  it("conta na API e manda o evento share do GA4", () => {
    recordShare({ _id: "p1", slug: "s", category: "seo" }, "linkedin", "rodape");
    expect(PostsService.engage).toHaveBeenCalledWith("p1", "share", "linkedin");
    expect(trackEvent).toHaveBeenCalledWith("share", {
      method: "linkedin",
      content_type: "article",
      item_id: "s",
      post_category: "seo",
      link_location: "rodape",
    });
  });
  it("aceita post com id (sem _id) e local padrão 'post'", () => {
    recordShare({ id: "p2", slug: "s" }, "x");
    expect(PostsService.engage).toHaveBeenCalledWith("p2", "share", "x");
    expect(trackEvent.mock.calls[0][1].link_location).toBe("post");
  });
});

describe("recordShareVisit", () => {
  const post = { _id: "p1", slug: "meu-post" };
  const at = (search) => window.history.replaceState({}, "", `/blog/meu-post${search}`);

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });
  afterEach(() => at(""));

  it("chegou por link compartilhado: conta a visita com o canal", () => {
    at("?utm_source=WhatsApp&utm_medium=share");
    recordShareVisit(post);
    expect(PostsService.engage).toHaveBeenCalledWith("p1", "share_visit", "whatsapp");
  });

  it("conta uma vez por sessão e por post", () => {
    at("?utm_source=x&utm_medium=share");
    recordShareVisit(post);
    recordShareVisit(post);
    expect(PostsService.engage).toHaveBeenCalledTimes(1);
    recordShareVisit({ _id: "p2", slug: "outro" });
    expect(PostsService.engage).toHaveBeenCalledTimes(2);
  });

  it("ignora medium diferente, canal desconhecido ou sem UTM", () => {
    at("?utm_source=x&utm_medium=email");
    recordShareVisit(post);
    at("?utm_source=orkut&utm_medium=share");
    recordShareVisit(post);
    at("");
    recordShareVisit(post);
    expect(PostsService.engage).not.toHaveBeenCalled();
  });

  it("todo canal oferecido na tela é aceito na visita", () => {
    for (const channel of Object.keys(SHARE_CHANNELS)) {
      sessionStorage.clear();
      at(`?utm_source=${channel}&utm_medium=share`);
      recordShareVisit(post);
    }
    expect(PostsService.engage).toHaveBeenCalledTimes(Object.keys(SHARE_CHANNELS).length);
  });
});
