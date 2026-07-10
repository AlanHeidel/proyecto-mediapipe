import { useEffect, useState } from "react";
import { ObjectDetector } from "@mediapipe/tasks-vision";
import { createObjectDetector } from "../lib/mediapipe/objects/createObjectDetector";

export type ObjectDetectorStatus = "idle" | "loading" | "ready" | "error";

export function useObjectDetector(enabled: boolean) {
  const [objectDetector, setObjectDetector] = useState<ObjectDetector | null>(
    null
  );
  const [status, setStatus] = useState<ObjectDetectorStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || objectDetector) {
      return;
    }

    let cancelled = false;

    const loadObjectDetector = async () => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const nextObjectDetector = await createObjectDetector();

        if (cancelled) {
          nextObjectDetector.close();
          return;
        }

        setObjectDetector(nextObjectDetector);
        setStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to initialize Object Detector."
        );
      }
    };

    loadObjectDetector();

    return () => {
      cancelled = true;
    };
  }, [enabled, objectDetector]);

  useEffect(() => {
    return () => {
      objectDetector?.close();
    };
  }, [objectDetector]);

  return { objectDetector, status, errorMessage };
}
