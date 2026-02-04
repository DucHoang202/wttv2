/**
 * Simple telemetry logging for tracking user interactions
 * In production, this would send events to an analytics service
 */

type TelemetryEvent = 
  | "step_viewed"
  | "ai_suggested"
  | "user_confirmed"
  | "user_edited"
  | "block_regenerated"
  | "publish_clicked"
  | "content_type_selected"
  | "step_completed";

interface EventData {
  event: TelemetryEvent;
  article_id?: string;
  step?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const logEvent = (event: TelemetryEvent, data?: Partial<EventData>) => {
  const eventData: EventData = {
    event,
    timestamp: new Date().toISOString(),
    ...data
  };

  // Log to console for demo purposes
  console.log(`[TELEMETRY] ${event}`, eventData);

  // In production, you would send this to your analytics service:
  // analytics.track(eventData);
  // mixpanel.track(event, eventData);
  // amplitude.logEvent(event, eventData);
};

export const measureStepTime = (stepId: string) => {
  const startTime = Date.now();

  return {
    end: () => {
      const duration = Date.now() - startTime;
      logEvent("step_completed", {
        step: stepId,
        metadata: { duration_ms: duration }
      });
      return duration;
    }
  };
};
