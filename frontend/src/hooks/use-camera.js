import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Production-ready camera hook for attendance photo capture
 * Handles camera access, photo capture, and error states
 */
export function useCamera() {
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  /**
   * Start camera with proper error handling
   * @param {Object} options - Camera options
   * @param {string} options.facingMode - 'user' for front camera, 'environment' for back
   * @param {number} options.width - Preferred video width
   * @param {number} options.height - Preferred video height
   */
  const startCamera = useCallback(
    async (options = {}) => {
      try {
        setIsStarting(true);
        setCameraError(null);
        setIsCapturing(false);

        // Stop any existing stream first
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }

        // Default camera options
        const cameraOptions = {
          facingMode: options.facingMode || "user", // Front-facing camera
          width: { ideal: options.width || 1280 },
          height: { ideal: options.height || 720 },
        };

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraOptions,
        });

        setCameraStream(stream);

        // Attach stream to video element
        const attachStream = () => {
          if (videoRef.current) {
            const video = videoRef.current;
            console.log("📹 Video element found, attaching stream");
            video.srcObject = stream;

            // Play video when metadata is loaded
            const playVideo = async () => {
              try {
                console.log(
                  "▶️ Attempting to play video, paused:",
                  video.paused,
                  "readyState:",
                  video.readyState
                );
                if (video.paused) {
                  await video.play();
                  console.log("✅ Video playing successfully");
                } else {
                  console.log("✅ Video already playing");
                }
              } catch (playError) {
                console.error("❌ Error playing video:", playError);
                // Retry after a short delay
                setTimeout(async () => {
                  try {
                    await video.play();
                    console.log("✅ Video playing after retry");
                  } catch (err) {
                    console.error("❌ Retry play failed:", err);
                    setCameraError("Failed to start video playback");
                  }
                }, 300);
              }
            };

            // Wait for metadata or play immediately if ready
            if (video.readyState >= 2) {
              console.log("📹 Video ready, playing immediately");
              playVideo();
            } else {
              console.log("📹 Waiting for video metadata...");
              video.addEventListener(
                "loadedmetadata",
                () => {
                  console.log("📹 Video metadata loaded");
                  playVideo();
                },
                { once: true }
              );

              // Fallback: try to play after a delay
              setTimeout(() => {
                if (video.readyState >= 2 && video.paused) {
                  console.log("📹 Fallback: Video ready, attempting play");
                  playVideo();
                }
              }, 500);
            }
          } else {
            console.warn("⚠️ Video element not found, retrying...");
            // Retry if video element not ready (max 10 retries)
            let retries = 0;
            const maxRetries = 10;
            const retryInterval = setInterval(() => {
              retries++;
              if (videoRef.current) {
                clearInterval(retryInterval);
                attachStream();
              } else if (retries >= maxRetries) {
                clearInterval(retryInterval);
                console.error("❌ Video element not found after retries");
                setCameraError(
                  "Camera element not ready. Please close and try again."
                );
              }
            }, 100);
          }
        };

        // Wait a bit for video element to be in DOM
        setTimeout(attachStream, 100);
      } catch (error) {
        console.error("Camera error:", error);
        let errorMessage = "Camera access denied";

        // Handle specific error types
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          errorMessage =
            "Camera permission denied. Please allow camera access in your browser settings and try again.";
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          errorMessage =
            "No camera found. Please connect a camera and try again.";
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          errorMessage =
            "Camera is already in use by another application. Please close other applications and try again.";
        } else if (
          error.name === "OverconstrainedError" ||
          error.name === "ConstraintNotSatisfiedError"
        ) {
          errorMessage =
            "Camera doesn't support the required settings. Trying with default settings...";
          // Retry with default settings
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            setCameraStream(fallbackStream);
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              videoRef.current.play();
            }
            return;
          } catch (fallbackError) {
            errorMessage =
              "Camera access failed. Please check your camera settings.";
          }
        } else {
          errorMessage = `Camera error: ${error.message || "Unknown error"}`;
        }

        setCameraError(errorMessage);

        // Stop any existing stream
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }
      } finally {
        setIsStarting(false);
      }
    },
    [cameraStream]
  );

  /**
   * Capture photo from video stream
   * @param {Object} options - Capture options
   * @param {number} options.maxWidth - Maximum width for captured image (default: 800)
   * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
   * @returns {string|null} Base64 encoded image or null on error
   */
  const capturePhoto = useCallback((options = {}) => {
    if (!videoRef.current || !canvasRef.current) {
      setCameraError("Camera not ready");
      return null;
    }

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Get video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (!videoWidth || !videoHeight) {
        setCameraError("Video not ready. Please wait a moment and try again.");
        return null;
      }

      // Calculate dimensions (max width to reduce file size)
      const maxWidth = options.maxWidth || 800;
      let newWidth = videoWidth;
      let newHeight = videoHeight;

      if (videoWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = (videoHeight / videoWidth) * maxWidth;
      }

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, newWidth, newHeight);

      // Convert to base64 with specified quality
      const quality = options.quality || 0.8;
      const photoBase64 = canvas.toDataURL("image/jpeg", quality);

      // Log image size for debugging
      const sizeInKB = (photoBase64.length * 3) / 4 / 1024;
      console.log(
        `Captured photo: ${newWidth}x${newHeight}, ${sizeInKB.toFixed(2)} KB`
      );

      setCapturedPhoto(photoBase64);
      return photoBase64;
    } catch (error) {
      console.error("Capture error:", error);
      setCameraError("Failed to capture photo. Please try again.");
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Stop camera and cleanup
   */
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setCameraError(null);
  }, [cameraStream]);

  /**
   * Reset camera state (stop camera and clear photo)
   */
  const resetCamera = useCallback(() => {
    stopCamera();
    setCapturedPhoto(null);
    setCameraError(null);
  }, [stopCamera]);

  // Effect to ensure stream is attached to video element when both are ready
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      const video = videoRef.current;

      // Only attach if not already attached or if stream changed
      if (video.srcObject !== cameraStream) {
        console.log("📹 Attaching stream to video element via useEffect");
        video.srcObject = cameraStream;

        // Ensure video plays
        const ensurePlay = async () => {
          try {
            if (video.paused) {
              await video.play();
              console.log("✅ Video playing successfully");
            } else {
              console.log("✅ Video already playing");
            }
          } catch (playError) {
            console.error("❌ Error playing video:", playError);
            // Retry after a short delay
            setTimeout(async () => {
              try {
                await video.play();
                console.log("✅ Video playing after retry");
              } catch (err) {
                console.error("❌ Retry play failed:", err);
              }
            }, 300);
          }
        };

        // Wait for metadata or play immediately if ready
        if (video.readyState >= 2) {
          ensurePlay();
        } else {
          const handleLoadedMetadata = () => {
            ensurePlay();
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          };
          video.addEventListener("loadedmetadata", handleLoadedMetadata);

          // Fallback: try to play after a delay even if metadata hasn't loaded
          setTimeout(() => {
            if (video.readyState >= 2 && video.paused) {
              ensurePlay();
            }
          }, 500);
        }
      } else {
        // Stream already attached, ensure it's playing
        if (video.paused && video.readyState >= 2) {
          video.play().catch((err) => {
            console.error("❌ Error playing already-attached video:", err);
          });
        }
      }
    }
  }, [cameraStream]);

  return {
    // State
    cameraStream,
    capturedPhoto,
    cameraError,
    isCapturing,
    isStarting,

    // Refs
    videoRef,
    canvasRef,

    // Functions
    startCamera,
    capturePhoto,
    stopCamera,
    resetCamera,

    // Helpers
    setCapturedPhoto,
    setCameraError,
  };
}
