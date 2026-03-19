import { useState, useEffect, useRef } from "react";

export interface Point {
  x: number;
  y: number;
}

export const useCameraTracking = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const facePosition = useRef<Point>({ x: 0.5, y: 0.5 }); // default center
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });

        streamRef.current = stream;
        setHasPermission(true);

        // Hidden video element to process frames
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        videoRef.current = video;

        // Optional experimental FaceDetector API
        if ((window as any).FaceDetector) {
          const detector = new (window as any).FaceDetector();
          const detectLoop = async () => {
            if (!videoRef.current) return;
            try {
              const faces = await detector.detect(videoRef.current);
              if (faces.length > 0) {
                const face = faces[0].boundingBox;
                // Map face bounding box center to [0,1] coords
                facePosition.current = {
                  x: (face.x + face.width / 2) / video.videoWidth,
                  y: (face.y + face.height / 2) / video.videoHeight,
                };
              }
            } catch (err) {
              console.warn("FaceDetector error:", err);
            }
            requestAnimationFrame(detectLoop);
          };
          detectLoop();
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { hasPermission, facePosition };
};