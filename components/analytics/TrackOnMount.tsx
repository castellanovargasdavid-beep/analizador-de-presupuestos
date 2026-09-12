"use client";

import { useEffect } from "react";
import type { AnalyticsEventType } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

interface TrackOnMountProps {
  eventType: AnalyticsEventType;
  estimateId?: string;
  comparisonId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dispara un evento una vez al montar la página (vista de resultado,
 * vista de comparación...). No renderiza nada visible.
 */
export function TrackOnMount({ eventType, estimateId, comparisonId, metadata }: TrackOnMountProps) {
  useEffect(() => {
    trackEvent({ eventType, estimateId, comparisonId, metadata });
    // Solo al montar: un cambio de props no debe volver a disparar el evento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
