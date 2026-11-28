import { describe, expect, it } from "vitest";
import { parseContacts } from "./parseContacts";

const emails = (r) => r.rows.map((x) => x.email);

describe("parseContacts: sem cabeçalho", () => {
  it("só o email", () => {
    const r = parseContacts("ana@x.com\nbia@x.com");
    expect(r.rows).toEqual([
      { line: 1, email: "ana@x.com", name: "" },
      { line: 2, email: "bia@x.com", name: "" },
    ]);
    expect(r.invalid).toEqual([]);
    expect(r.duplicates).toBe(0);
  });

  it("'Nome <email>'", () => {
    expect(parseContacts("Ana Souza <Ana@X.com>").rows).toEqual([{ line: 1, email: "ana@x.com", name: "Ana Souza" }]);
  });

  it("'Nome, email' e 'email; Nome'", () => {
    expect(parseContacts("Ana, ana@x.com").rows[0]).toMatchObject({ email: "ana@x.com", name: "Ana" });
    expect(parseContacts("bia@x.com; Bia Lima").rows[0]).toMatchObject({ email: "bia@x.com", name: "Bia Lima" });
  });

  it("entrada vazia, nula ou só espaços", () => {
    for (const v of ["", null, undefined, "  \n \n"]) {
      expect(parseContacts(v)).toEqual({ rows: [], invalid: [], duplicates: 0 });
    }
  });
});

describe("parseContacts: com cabeçalho", () => {
  it("CSV com vírgula (email, nome)", () => {
    const r = parseContacts("email,nome\nana@x.com,Ana\nbia@x.com,Bia");
    expect(r.rows).toEqual([
      { line: 2, email: "ana@x.com", name: "Ana" },
      { line: 3, email: "bia@x.com", name: "Bia" },
    ]);
  });

  it("CSV do Excel em português: ponto e vírgula, cabeçalho com maiúsculas", () => {
    const r = parseContacts("Nome;E-mail\nAna;ana@x.com");
    expect(r.rows).toEqual([{ line: 2, email: "ana@x.com", name: "Ana" }]);
  });

  it("separado por tab, colunas em outra ordem", () => {
    const r = parseContacts("name\temail\nAna\tana@x.com");
    expect(r.rows[0]).toMatchObject({ email: "ana@x.com", name: "Ana" });
  });

  it("nome entre aspas com vírgula dentro", () => {
    const r = parseContacts('nome;email\n"Silva, João";joao@x.com');
    expect(r.rows[0]).toMatchObject({ email: "joao@x.com", name: "Silva, João" });
  });

  it("BOM no começo do arquivo e linhas CRLF", () => {
    const r = parseContacts("﻿email,nome\r\nana@x.com,Ana\r\n");
    expect(r.rows).toEqual([{ line: 2, email: "ana@x.com", name: "Ana" }]);
  });

  it("linhas em branco não contam, mas o número da linha é o do texto", () => {
    const r = parseContacts("email\n\nana@x.com");
    expect(r.rows[0].line).toBe(3);
  });
});

describe("parseContacts: inválidos e duplicados", () => {
  it("linhas sem email válido vão para invalid, com o número da linha", () => {
    const r = parseContacts("ana@x.com\nsem-arroba\nfulano@semponto");
    expect(emails(r)).toEqual(["ana@x.com"]);
    expect(r.invalid).toEqual([
      { line: 2, text: "sem-arroba" },
      { line: 3, text: "fulano@semponto" },
    ]);
  });

  it("duplicados (ignorando maiúsculas) são contados e descartados", () => {
    const r = parseContacts("ana@x.com\nANA@x.com\nbia@x.com\nana@x.com");
    expect(emails(r)).toEqual(["ana@x.com", "bia@x.com"]);
    expect(r.duplicates).toBe(2);
  });

  it("texto inválido é cortado em 80 caracteres", () => {
    const r = parseContacts("x".repeat(200));
    expect(r.invalid[0].text).toHaveLength(80);
  });

  it("nome é limpo: espaços repetidos e limitado a 120 caracteres", () => {
    expect(parseContacts("Ana    Maria <ana@x.com>").rows[0].name).toBe("Ana Maria");
    expect(parseContacts(`${"a".repeat(300)} <ana@x.com>`).rows[0].name).toHaveLength(120);
  });
});
