import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isTerminalStatus, InvalidLeadTransitionError } from "./state-machine";

describe("state-machine", () => {
  it("permite las transiciones normales del ciclo de vida", () => {
    expect(canTransition("nuevo", "validado")).toBe(true);
    expect(canTransition("validado", "en_cola")).toBe(true);
    expect(canTransition("en_cola", "asignado")).toBe(true);
    expect(canTransition("asignado", "notificado")).toBe(true);
    expect(canTransition("notificado", "aceptado")).toBe(true);
    expect(canTransition("aceptado", "contacto_pendiente")).toBe(true);
    expect(canTransition("contacto_pendiente", "contacto_confirmado")).toBe(true);
    expect(canTransition("contacto_confirmado", "presupuesto_pendiente")).toBe(true);
    expect(canTransition("presupuesto_pendiente", "presupuesto_enviado")).toBe(true);
    expect(canTransition("presupuesto_enviado", "ganado")).toBe(true);
  });

  it("rechaza saltos de estado arbitrarios", () => {
    expect(canTransition("nuevo", "ganado")).toBe(false);
    expect(canTransition("validado", "presupuesto_enviado")).toBe(false);
    expect(canTransition("cerrado", "asignado")).toBe(false); // terminal: no reabre
  });

  it("no permite una transición a sí mismo", () => {
    expect(canTransition("asignado", "asignado")).toBe(false);
  });

  it("assertTransition lanza InvalidLeadTransitionError en un salto no permitido", () => {
    expect(() => assertTransition("nuevo", "ganado")).toThrow(InvalidLeadTransitionError);
  });

  it("assertTransition no lanza en una transición válida", () => {
    expect(() => assertTransition("nuevo", "validado")).not.toThrow();
  });

  it("distingue correctamente los estados terminales de los no terminales", () => {
    expect(isTerminalStatus("cerrado")).toBe(true);
    expect(isTerminalStatus("ganado")).toBe(true);
    expect(isTerminalStatus("perdido")).toBe(true);
    expect(isTerminalStatus("cancelado")).toBe(true);
    expect(isTerminalStatus("invalido")).toBe(true);
    expect(isTerminalStatus("descartado")).toBe(true);
    expect(isTerminalStatus("nuevo")).toBe(false);
    expect(isTerminalStatus("asignado")).toBe(false);
    expect(isTerminalStatus("contacto_pendiente")).toBe(false);
  });

  it("no reasigna solo porque el lead esté aceptado sin más avance: 'aceptado' no tiene salida directa a reasignación automática de negocio, solo a contacto o incidencia", () => {
    // La reasignación automática solo debe dispararse por plazos vencidos
    // (ver reassignment-service), nunca porque el usuario no haya
    // contratado. Aquí solo verificamos que el grafo no ofrece un atajo
    // directo de "aceptado" a un estado de reasignación sin pasar por
    // contacto_pendiente primero.
    expect(canTransition("aceptado", "reasignacion_pendiente")).toBe(false);
  });
});
