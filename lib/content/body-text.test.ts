import { describe, expect, it } from "vitest";
import { parseGuideBodyText, serializeGuideBody } from "./body-text";
import type { GuideBlock } from "./blocks";

describe("parseGuideBodyText", () => {
  it("parsea un encabezado, un párrafo y una lista", () => {
    const text = `## Título de sección
Un párrafo suelto.
- primer punto
- segundo punto`;

    const blocks = parseGuideBodyText(text);
    expect(blocks).toEqual([
      { type: "heading", text: "Título de sección" },
      { type: "paragraph", text: "Un párrafo suelto." },
      { type: "list", items: ["primer punto", "segundo punto"] },
    ]);
  });

  it("ignora líneas en blanco sin generar bloques vacíos", () => {
    const blocks = parseGuideBodyText("Párrafo uno.\n\n\nPárrafo dos.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Párrafo uno." },
      { type: "paragraph", text: "Párrafo dos." },
    ]);
  });

  it("cierra una lista al encontrar un párrafo o encabezado después", () => {
    const blocks = parseGuideBodyText("- a\n- b\nOtro párrafo\n- c");
    expect(blocks).toEqual([
      { type: "list", items: ["a", "b"] },
      { type: "paragraph", text: "Otro párrafo" },
      { type: "list", items: ["c"] },
    ]);
  });
});

describe("serializeGuideBody / parseGuideBodyText round-trip", () => {
  it("ida y vuelta reconstruye los mismos bloques", () => {
    const original: GuideBlock[] = [
      { type: "heading", text: "Sección" },
      { type: "paragraph", text: "Texto." },
      { type: "list", items: ["uno", "dos", "tres"] },
      { type: "paragraph", text: "Cierre." },
    ];
    const text = serializeGuideBody(original);
    const reparsed = parseGuideBodyText(text);
    expect(reparsed).toEqual(original);
  });
});
