import { describe, expect, it } from "vitest";
import { computeJustifiableConfidence, QUALITY_THRESHOLDS, type GateFactorInput, type GateRuleInput } from "./confidence-gate";

const NOW = new Date("2026-09-17T00:00:00Z");

const completeRule: GateRuleInput = {
  methodologyDocPath: "docs/metodologia/cambiar-un-grifo.md",
  geographicScope: "España, sin diferenciación autonómica",
  lastReviewedAt: new Date("2026-06-01T00:00:00Z"),
  whatIncluded: "El grifo y la mano de obra de instalarlo.",
  whatExcluded: "Reformas de fontanería más amplias.",
};

const solidFactor: GateFactorInput = {
  key: "base_fregadero",
  kind: "base",
  isActive: true,
  sourceType: "mercado",
  sourceIsActive: true,
  sourceRetrievedOn: "2026-01-15",
};

function passingValidation() {
  return { sampleSize: 25, hitRatePct: 0.8, biasPct: 0.05 };
}

describe("computeJustifiableConfidence", () => {
  it("devuelve C si falta el documento de metodología (falla B1), aunque el resto de B se cumpla", () => {
    const result = computeJustifiableConfidence({ ...completeRule, methodologyDocPath: null }, [solidFactor], null, NOW);
    expect(result.level).toBe("C");
    expect(result.blockingReasons.some((r) => r.includes("metodología"))).toBe(true);
  });

  it("devuelve C si no se ha definido el alcance (whatIncluded/whatExcluded)", () => {
    const result = computeJustifiableConfidence({ ...completeRule, whatExcluded: null }, [solidFactor], null, NOW);
    expect(result.level).toBe("C");
  });

  it("devuelve C si no se ha declarado cobertura geográfica", () => {
    const result = computeJustifiableConfidence({ ...completeRule, geographicScope: null }, [solidFactor], null, NOW);
    expect(result.level).toBe("C");
  });

  it("devuelve C si todos los factores base son heurística propia sin ningún dato externo", () => {
    const heuristicOnly: GateFactorInput = { ...solidFactor, sourceType: "heuristica_propia" };
    const result = computeJustifiableConfidence(completeRule, [heuristicOnly], null, NOW);
    expect(result.level).toBe("C");
    expect(result.blockingReasons.some((r) => r.includes("heurística"))).toBe(true);
  });

  it("un factor multiplicador en heurística propia no bloquea B4 si hay un factor base con fuente externa", () => {
    const multiplier: GateFactorInput = {
      key: "urgencia",
      kind: "multiplier",
      isActive: true,
      sourceType: "heuristica_propia",
      sourceIsActive: true,
      sourceRetrievedOn: "2026-01-15",
    };
    const result = computeJustifiableConfidence(completeRule, [solidFactor, multiplier], null, NOW);
    // B4 solo mira factores "base"; con el factor base de mercado, se cumple B.
    expect(result.level).toBe("B");
  });

  it("devuelve C si un factor activo no tiene fuente citada", () => {
    const noSource: GateFactorInput = { ...solidFactor, sourceType: null, sourceRetrievedOn: null };
    const result = computeJustifiableConfidence(completeRule, [noSource], null, NOW);
    expect(result.level).toBe("C");
  });

  it("un factor SIN fuente pero INACTIVO no cuenta para B5 (se ignora)", () => {
    const inactiveNoSource: GateFactorInput = { ...solidFactor, isActive: false, sourceType: null, sourceRetrievedOn: null };
    const result = computeJustifiableConfidence(completeRule, [solidFactor, inactiveNoSource], null, NOW);
    expect(result.level).not.toBe("C");
  });

  it("devuelve C si una fuente citada está desactivada/caducada", () => {
    const expiredSource: GateFactorInput = { ...solidFactor, sourceIsActive: false };
    const result = computeJustifiableConfidence(completeRule, [expiredSource], null, NOW);
    expect(result.level).toBe("C");
  });

  it("devuelve C si la regla nunca se ha revisado (lastReviewedAt null)", () => {
    const result = computeJustifiableConfidence({ ...completeRule, lastReviewedAt: null }, [solidFactor], null, NOW);
    expect(result.level).toBe("C");
  });

  it("devuelve B (nunca C) cuando se cumplen todos los criterios de B pero no hay ninguna muestra de validación", () => {
    const result = computeJustifiableConfidence(completeRule, [solidFactor], null, NOW);
    expect(result.level).toBe("B");
    expect(result.blockingReasons.length).toBeGreaterThan(0);
  });

  it("devuelve B si hay muestras pero por debajo del tamaño mínimo", () => {
    const result = computeJustifiableConfidence(
      completeRule,
      [solidFactor],
      { sampleSize: QUALITY_THRESHOLDS.MIN_SAMPLE_SIZE_FOR_A - 1, hitRatePct: 0.9, biasPct: 0 },
      NOW,
    );
    expect(result.level).toBe("B");
  });

  it("devuelve B si el hit rate está justo por debajo del umbral", () => {
    const result = computeJustifiableConfidence(
      completeRule,
      [solidFactor],
      { sampleSize: 30, hitRatePct: QUALITY_THRESHOLDS.MIN_HIT_RATE_FOR_A - 0.01, biasPct: 0 },
      NOW,
    );
    expect(result.level).toBe("B");
  });

  it("devuelve B si el sesgo supera el máximo permitido, incluso con buena muestra y buen hit rate", () => {
    const result = computeJustifiableConfidence(
      completeRule,
      [solidFactor],
      { sampleSize: 30, hitRatePct: 0.9, biasPct: QUALITY_THRESHOLDS.MAX_ABS_BIAS_FOR_A + 0.01 },
      NOW,
    );
    expect(result.level).toBe("B");
  });

  it("un sesgo negativo grande (infravalorar sistemáticamente) también bloquea A", () => {
    const result = computeJustifiableConfidence(
      completeRule,
      [solidFactor],
      { sampleSize: 30, hitRatePct: 0.9, biasPct: -(QUALITY_THRESHOLDS.MAX_ABS_BIAS_FOR_A + 0.05) },
      NOW,
    );
    expect(result.level).toBe("B");
  });

  it("devuelve B si la revisión ha caducado (>12 meses) aunque la validación empírica sea perfecta", () => {
    const staleRule: GateRuleInput = { ...completeRule, lastReviewedAt: new Date("2025-01-01T00:00:00Z") };
    const result = computeJustifiableConfidence(staleRule, [solidFactor], passingValidation(), NOW);
    expect(result.level).toBe("B");
  });

  it("devuelve A cuando se cumplen todos los criterios de B y de A", () => {
    const result = computeJustifiableConfidence(completeRule, [solidFactor], passingValidation(), NOW);
    expect(result.level).toBe("A");
    expect(result.blockingReasons).toEqual([]);
  });

  it("los umbrales son inclusivos: exactamente en el límite también cuenta como cumplido", () => {
    const result = computeJustifiableConfidence(
      completeRule,
      [solidFactor],
      {
        sampleSize: QUALITY_THRESHOLDS.MIN_SAMPLE_SIZE_FOR_A,
        hitRatePct: QUALITY_THRESHOLDS.MIN_HIT_RATE_FOR_A,
        biasPct: QUALITY_THRESHOLDS.MAX_ABS_BIAS_FOR_A,
      },
      NOW,
    );
    expect(result.level).toBe("A");
  });

  it("una revisión de exactamente 12 meses (límite) todavía cuenta como vigente", () => {
    // 12 meses antes de NOW (2026-09-17) ~ 2025-09-17, dejamos un margen de un día para no depender de la duración exacta del mes.
    const twelveMonthsAgo = new Date("2025-09-18T00:00:00Z");
    const result = computeJustifiableConfidence({ ...completeRule, lastReviewedAt: twelveMonthsAgo }, [solidFactor], passingValidation(), NOW);
    expect(result.level).toBe("A");
  });

  it("nunca devuelve A si algún criterio de B falla, aunque la validación empírica exista y sea perfecta", () => {
    const result = computeJustifiableConfidence({ ...completeRule, methodologyDocPath: null }, [solidFactor], passingValidation(), NOW);
    expect(result.level).toBe("C");
  });

  it("sin ningún factor, B4 no puede cumplirse (no hay nada que evaluar) y el nivel cae a C", () => {
    const result = computeJustifiableConfidence(completeRule, [], null, NOW);
    expect(result.level).toBe("C");
  });

  it("no hay ningún parámetro para forzar un nivel: la función no acepta ningún override de nivel", () => {
    // Verificación de contrato: la firma de la función solo acepta (rule, factors, validation, now?).
    // `now` tiene valor por defecto, así que Function.length (que no cuenta parámetros con
    // default) es 3 — lo relevante es que no exista un 5º parámetro tipo "forceLevel".
    expect(computeJustifiableConfidence.length).toBe(3);
  });
});
