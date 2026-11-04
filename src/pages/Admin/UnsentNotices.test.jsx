import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { UnsentNotices } from "./Dashboard";

// BIZ-03: avisos de post publicado que não saíram, no Dashboard
const renderNotices = (notices) =>
  render(
    <MemoryRouter>
      <UnsentNotices notices={notices} />
    </MemoryRouter>
  );

describe("UnsentNotices", () => {
  afterEach(cleanup);

  it("sem pendência, não aparece", () => {
    renderNotices([]);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("cada aviso leva ao envio dele", () => {
    renderNotices([{ _id: "c1", postTitle: "Guia de SEO" }]);
    expect(screen.getByText("Guia de SEO").getAttribute("href")).toBe("/admin/campaigns/c1");
    expect(screen.getByRole("status").textContent).toContain("1 aviso de post publicado não foi enviado");
  });

  it("muitos avisos: mostra 3 e resume o resto", () => {
    renderNotices(["a", "b", "c", "d", "e"].map((id) => ({ _id: id, postTitle: `Post ${id}` })));
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("e mais 2 em Envios").getAttribute("href")).toBe("/admin/campaigns");
  });
});
