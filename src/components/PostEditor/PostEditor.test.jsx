import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Sem rede: o serviço de posts e os demais serviços são simulados
vi.mock("../../services/posts.service", () => ({
  default: { create: vi.fn(), update: vi.fn(), getById: vi.fn(), getCalendar: vi.fn().mockResolvedValue([]) },
}));
vi.mock("../../services/upload.service", () => ({ default: { uploadCover: vi.fn() } }));
vi.mock("../../services/subscriber.service", () => ({
  default: { getCategories: vi.fn().mockResolvedValue([{ slug: "seo", label: "SEO" }]) },
}));

const toast = vi.fn();
vi.mock("../../hooks/useToast", () => ({ useToast: () => toast }));

// Partes pesadas (editor de texto, uploads, seções de email/LinkedIn) viram stubs;
// só ficam os controles de que o editor depende para este teste.
vi.mock("../Header", () => ({ default: () => null }));
vi.mock("../SEO", () => ({ default: () => null }));
vi.mock("../RichTextEditor", () => ({ default: () => null }));
vi.mock("../ImageManager", () => ({ default: () => null }));
vi.mock("../CoverImageUpload", () => ({ default: () => null }));
vi.mock("../FaqFields", () => ({ default: () => null }));
vi.mock("../PostLinksSection", () => ({ default: () => null }));
vi.mock("../PostLinkedInSection", () => ({ default: () => null }));
vi.mock("../ClusterFields", () => ({ default: () => null }));
vi.mock("../SeasonFields", () => ({ default: () => null }));
vi.mock("../PostPreview", () => ({ default: () => null }));
vi.mock("../PostHistory", () => ({ default: () => null }));
vi.mock("../PostEmailSection", () => ({
  default: ({ onRecipientsChange }) => (
    <button type="button" onClick={() => onRecipientsChange(42)}>
      stub: 42 destinatários
    </button>
  ),
}));
vi.mock("../PostStatusField", () => ({
  default: ({ onChange }) => (
    <div>
      <button type="button" onClick={() => onChange({ status: "draft" })}>stub: rascunho</button>
      <button type="button" onClick={() => onChange({ status: "planned" })}>stub: agendar</button>
      <button type="button" onClick={() => onChange({ status: "published" })}>stub: publicar</button>
      <button type="button" onClick={() => onChange({ plannedAt: "2026-12-01" })}>stub: data</button>
    </div>
  ),
}));
vi.mock("../FilterChips", () => ({
  default: ({ options, onChange }) => (
    <div>
      {options.map((o) => (
        <button key={o.slug} type="button" onClick={() => onChange(o.slug)}>
          {`stub categoria ${o.label}`}
        </button>
      ))}
    </div>
  ),
}));

import PostsService from "../../services/posts.service";
import PostEditor from "./index";

const renderEditor = () => {
  const router = createMemoryRouter(
    [
      { path: "/admin/posts/new", element: <PostEditor /> },
      { path: "/admin/posts", element: <p>lista de posts</p> },
      { path: "/admin/posts/:id", element: <p>post salvo</p> },
    ],
    { initialEntries: ["/admin/posts/new"] }
  );
  render(<RouterProvider router={router} />);
  return router;
};

const click = (name) => fireEvent.click(screen.getByRole("button", { name }));
const typeTitle = (value) => fireEvent.change(screen.getByLabelText(/Título/, { selector: "#title" }), { target: { value } });
const pickCategory = async () => fireEvent.click(await screen.findByRole("button", { name: "stub categoria SEO" }));
const saveButton = () => screen.getByRole("button", { name: /Salvar rascunho|Agendar publicação|Publicar|Salvar alterações/ });

describe("PostEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    PostsService.create.mockResolvedValue({ _id: "novo1", slug: "meu-post" });
  });
  afterEach(cleanup);

  describe("não salva sem os campos obrigatórios", () => {
    it("sem título", async () => {
      renderEditor();
      await pickCategory();
      fireEvent.click(saveButton());
      expect(toast).toHaveBeenCalledWith("Escreva o título do post", "error");
      expect(PostsService.create).not.toHaveBeenCalled();
    });

    it("título só com espaços conta como vazio", async () => {
      renderEditor();
      await pickCategory();
      typeTitle("   ");
      fireEvent.click(saveButton());
      expect(toast).toHaveBeenCalledWith("Escreva o título do post", "error");
      expect(PostsService.create).not.toHaveBeenCalled();
    });

    it("sem categoria", async () => {
      renderEditor();
      typeTitle("Meu post");
      fireEvent.click(saveButton());
      expect(toast).toHaveBeenCalledWith("Escolha a categoria do post", "error");
      expect(PostsService.create).not.toHaveBeenCalled();
    });

    it("agendado sem data de publicação", async () => {
      renderEditor();
      await pickCategory();
      typeTitle("Meu post");
      click("stub: agendar");
      fireEvent.click(saveButton());
      expect(toast).toHaveBeenCalledWith("Escolha a data de publicação do post agendado", "error");
      expect(PostsService.create).not.toHaveBeenCalled();
    });

    it("agendado com data: salva", async () => {
      renderEditor();
      await pickCategory();
      typeTitle("Meu post");
      click("stub: agendar");
      click("stub: data");
      fireEvent.click(saveButton());
      await waitFor(() => expect(PostsService.create).toHaveBeenCalledTimes(1));
      expect(PostsService.create.mock.calls[0][0]).toMatchObject({
        title: "Meu post",
        category: "seo",
        status: "planned",
        plannedAt: "2026-12-01",
        published: false,
      });
    });

    it("rascunho só com título e categoria: salva sem exigir data", async () => {
      renderEditor();
      await pickCategory();
      typeTitle("Meu post");
      fireEvent.click(saveButton());
      await waitFor(() => expect(PostsService.create).toHaveBeenCalledTimes(1));
      expect(toast).toHaveBeenCalledWith("Rascunho salvo");
    });
  });

  describe("publicar com email", () => {
    const fillAndPublish = async () => {
      renderEditor();
      await pickCategory();
      typeTitle("Meu post");
      click("stub: publicar");
      click("stub: 42 destinatários");
      fireEvent.click(saveButton());
    };

    it("pede confirmação com o número de pessoas e não salva antes", async () => {
      await fillAndPublish();
      expect(await screen.findByRole("alertdialog")).toBeTruthy();
      expect(screen.getByText("Publicar e enviar para 42 pessoas?")).toBeTruthy();
      expect(PostsService.create).not.toHaveBeenCalled();
    });

    it("cancelar fecha o diálogo e não publica", async () => {
      await fillAndPublish();
      click("Cancelar");
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(PostsService.create).not.toHaveBeenCalled();
    });

    it("confirmar publica com published=true e sem data", async () => {
      await fillAndPublish();
      click("Publicar e enviar");
      await waitFor(() => expect(PostsService.create).toHaveBeenCalledTimes(1));
      expect(PostsService.create.mock.calls[0][0]).toMatchObject({ status: "published", published: true, plannedAt: null, emailNotify: true });
      expect(toast).toHaveBeenCalledWith("Post publicado");
    });

    it("Ctrl+S também passa pela confirmação", async () => {
      renderEditor();
      await pickCategory();
      typeTitle("Meu post");
      click("stub: publicar");
      fireEvent.keyDown(window, { key: "s", ctrlKey: true });
      expect(await screen.findByRole("alertdialog")).toBeTruthy();
      expect(PostsService.create).not.toHaveBeenCalled();
    });

    it("publicar com título faltando: a validação barra mesmo depois de confirmar", async () => {
      renderEditor();
      await pickCategory();
      click("stub: publicar");
      fireEvent.click(saveButton());
      // A confirmação abre primeiro; ao confirmar, a validação barra o salvamento
      click("Publicar e enviar");
      expect(toast).toHaveBeenCalledWith("Escreva o título do post", "error");
      expect(PostsService.create).not.toHaveBeenCalled();
    });
  });

  describe("aviso de alterações não salvas", () => {
    it("recém-aberto: 'Tudo salvo' e sem aviso ao sair", async () => {
      const router = renderEditor();
      expect(screen.getByText(/Tudo salvo/)).toBeTruthy();
      await act(() => router.navigate("/admin/posts"));
      expect(screen.getByText("lista de posts")).toBeTruthy();
    });

    it("com alteração: mostra o aviso na barra e registra o beforeunload", () => {
      renderEditor();
      typeTitle("Mudei");
      expect(screen.getByText(/Alterações não salvas/)).toBeTruthy();
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it("sem alteração, fechar a aba não é bloqueado", () => {
      renderEditor();
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });

    it("sair com alteração abre 'Sair sem salvar?'; continuar editando mantém a página", async () => {
      const router = renderEditor();
      typeTitle("Mudei");
      await act(() => router.navigate("/admin/posts"));
      expect(await screen.findByText("Sair sem salvar?")).toBeTruthy();
      click("Continuar editando");
      expect(screen.queryByText("Sair sem salvar?")).toBeNull();
      expect(screen.queryByText("lista de posts")).toBeNull();
      expect(router.state.location.pathname).toBe("/admin/posts/new");
    });

    it("sair com alteração e confirmar 'Sair sem salvar' navega", async () => {
      const router = renderEditor();
      typeTitle("Mudei");
      await act(() => router.navigate("/admin/posts"));
      click("Sair sem salvar");
      expect(await screen.findByText("lista de posts")).toBeTruthy();
    });

    it("depois de salvar, o aviso some (Tudo salvo)", async () => {
      renderEditor();
      await pickCategory();
      typeTitle("Meu post");
      fireEvent.click(saveButton());
      expect(await screen.findByText("post salvo")).toBeTruthy();
    });
  });
});
