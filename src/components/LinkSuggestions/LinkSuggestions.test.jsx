import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import LinkSuggestions from "./index";
import ContentMapService from "../../services/contentMap.service";

vi.mock("../../services/contentMap.service", () => ({ default: { getLinkSuggestions: vi.fn() } }));

const make = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `id${i}`,
    title: `Post ${i} & "aspas"`,
    slug: `post-${i}`,
    url: `https://blog.marck0101.com.br/blog/post-${i}`,
    sharedTags: i === 0 ? ["ga4", "seo"] : ["ga4"],
  }));

function fakeEditor(selectionEmpty) {
  const chain = {
    focus: vi.fn(() => chain),
    setLink: vi.fn(() => chain),
    insertContent: vi.fn(() => chain),
    run: vi.fn(),
  };
  return { chain: () => chain, state: { selection: { empty: selectionEmpty } }, isDestroyed: false, _c: chain };
}

async function renderPanel(editor, suggestions = make(7)) {
  ContentMapService.getLinkSuggestions.mockResolvedValue(suggestions);
  render(<LinkSuggestions editor={editor} postId="abc" tags={["ga4", "seo"]} content="<p>oi</p>" />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(900);
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("LinkSuggestions", () => {
  it("manda tags e texto do editor e lista no máximo 5", async () => {
    await renderPanel(fakeEditor(true));
    expect(ContentMapService.getLinkSuggestions).toHaveBeenCalledWith({ postId: "abc", tags: ["ga4", "seo"], content: "<p>oi</p>" });
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByText("2 tags em comum")).toBeTruthy();
  });

  it("sem seleção, o clique acrescenta a frase com o link no fim do texto", async () => {
    const editor = fakeEditor(true);
    await renderPanel(editor);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(editor._c.focus).toHaveBeenCalledWith("end");
    expect(editor._c.insertContent).toHaveBeenCalledWith(
      '<p>Leia também: <a href="https://blog.marck0101.com.br/blog/post-0">Post 0 &amp; &quot;aspas&quot;</a></p>'
    );
    expect(editor._c.setLink).not.toHaveBeenCalled();
  });

  it("com seleção, o trecho vira a âncora do link", async () => {
    const editor = fakeEditor(false);
    await renderPanel(editor);
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(editor._c.setLink).toHaveBeenCalledWith({ href: "https://blog.marck0101.com.br/blog/post-1" });
    expect(editor._c.insertContent).not.toHaveBeenCalled();
  });

  it("sem tags não consulta nem mostra nada; erro da API esconde o painel", async () => {
    render(<LinkSuggestions editor={fakeEditor(true)} tags={[]} content="" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(ContentMapService.getLinkSuggestions).not.toHaveBeenCalled();
    cleanup();

    ContentMapService.getLinkSuggestions.mockRejectedValue(new Error("x"));
    render(<LinkSuggestions editor={fakeEditor(true)} tags={["ga4"]} content="" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(screen.queryByRole("button")).toBeNull();
  });
});
