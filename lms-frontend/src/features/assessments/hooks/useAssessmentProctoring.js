import { useState, useEffect, useRef, useCallback } from 'react';

const MAX_STRIKES = 3;

/**
 * Screen Recording Proctoring & Anti-Cheat Lockdown Hook:
 *
 * 1. Fullscreen Enforcement (detects exits, prompts re-entry)
 * 2. Tab Switch & Visibility Watcher (counts strikes, warns student)
 * 3. Continuous Screen Recording (uses getDisplayMedia to record screen activity)
 * 4. Screen Sharing Stop Detection (issues strike if screen share is cancelled)
 * 5. Shortcut & Right-Click Prevention (blocks F12, DevTools, Ctrl+C on problem, print)
 * 6. Auto-Submit on 3 Strikes Security Violation
 */
export function useAssessmentProctoring({
  enabled = true,
  onSecurityViolationSubmit,
  suppressRef: externalSuppressRef = null,
}) {
  // Use external ref if provided (gives synchronous suppress without render lag)
  const internalSuppressRef = useRef(false);
  const suppressRef = externalSuppressRef ?? internalSuppressRef;
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lastViolation, setLastViolation] = useState(null);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isRulesAgreed, setIsRulesAgreed] = useState(false);

  // Screen recording stream state
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [proctoringLogs, setProctoringLogs] = useState([]);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const logViolation = useCallback((type, message) => {
    const entry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setProctoringLogs((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  // Request browser Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        logViolation('FULLSCREEN_ENTERED', 'Entered fullscreen exam mode.');
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, [logViolation]);

  // Handle security strike
  const recordStrike = useCallback((reason) => {
    if (!enabled || isTerminated || !isRulesAgreed || suppressRef.current) return;

    setTabSwitchCount((prev) => {
      const nextCount = prev + 1;
      const violationMsg = `${reason} (Violation ${nextCount} of ${MAX_STRIKES})`;
      setLastViolation({ reason, count: nextCount, max: MAX_STRIKES });
      setShowViolationModal(true);
      logViolation('SECURITY_VIOLATION', violationMsg);

      if (nextCount >= MAX_STRIKES) {
        setIsTerminated(true);
        logViolation('EXAM_TERMINATED', 'Maximum violation strikes exceeded. Auto-submitting.');
        onSecurityViolationSubmit?.();
      }

      return nextCount;
    });
  }, [enabled, isTerminated, isRulesAgreed, logViolation, onSecurityViolationSubmit, suppressRef]);

  // Request & Start Continuous Screen Recording
  const startScreenRecording = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor', // Prefer entire screen
            frameRate: { ideal: 10, max: 15 },
          },
          audio: false,
        });

        setScreenStream(stream);
        setIsScreenRecording(true);
        logViolation('SCREEN_RECORDING_STARTED', 'Screen recording stream initiated.');

        // Initialize background MediaRecorder for the session
        try {
          recordedChunksRef.current = [];
          const recorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
              ? 'video/webm;codecs=vp9'
              : 'video/webm',
          });

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          recorder.start(10000); // 10s chunk intervals
          mediaRecorderRef.current = recorder;
        } catch (recErr) {
          console.warn('MediaRecorder recording note:', recErr);
        }

        // Detect if the student manually stops screen sharing
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setIsScreenRecording(false);
            setScreenStream(null);
            if (!suppressRef.current) {
              recordStrike('Screen sharing was interrupted or stopped');
            }
          };
        }

        return stream;
      }
      return null;
    } catch (err) {
      console.warn('Screen recording request cancelled or unsupported:', err);
      // If user cancelled screen share dialog, issue a warning/strike
      setIsScreenRecording(false);
      logViolation('SCREEN_RECORDING_ERROR', 'Screen recording permission was not granted.');
      return null;
    }
  }, [logViolation, recordStrike]);

  // Stop screen recording on finish / cleanup
  const stopScreenRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch { /* Best-effort browser cleanup; failure must not block the workflow. */ }
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    setIsScreenRecording(false);
  }, [screenStream]);

  // Stop recording and compile all WebM chunks into a single Blob (with guaranteed timeout)
  const stopAndGetRecordingBlob = useCallback(async () => {
    return new Promise((resolve) => {
      let resolved = false;
      const doResolve = (blob) => {
        if (resolved) return;
        resolved = true;
        resolve(blob);
      };

      // Safeguard timeout (max 1.5s) to ensure submission is never blocked
      const timeoutId = setTimeout(() => {
        const blob = recordedChunksRef.current.length > 0
          ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
          : null;
        doResolve(blob);
      }, 1500);

      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.onstop = () => {
            clearTimeout(timeoutId);
            const blob = new Blob(recordedChunksRef.current, {
              type: recordedChunksRef.current[0]?.type || 'video/webm',
            });
            doResolve(blob);
          };
          mediaRecorderRef.current.stop();
        } else {
          clearTimeout(timeoutId);
          const blob = recordedChunksRef.current.length > 0
            ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
            : null;
          doResolve(blob);
        }
      } catch (e) {
        clearTimeout(timeoutId);
        const blob = recordedChunksRef.current.length > 0
          ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
          : null;
        doResolve(blob);
      }

      if (screenStream) {
        try {
          screenStream.getTracks().forEach((track) => track.stop());
        } catch { /* Best-effort browser cleanup; failure must not block the workflow. */ }
        setScreenStream(null);
      }
      setIsScreenRecording(false);
    });
  }, [screenStream]);

  // ── 1. Fullscreen Change Listener ─────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !isRulesAgreed) return;

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);

      if (!active && !isTerminated && !suppressRef.current) {
        recordStrike('Fullscreen mode exited');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [enabled, isRulesAgreed, isTerminated, recordStrike]);

  // ── 2. Visibility & Tab Switch Listener ───────────────────────────────────
  useEffect(() => {
    if (!enabled || !isRulesAgreed) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isTerminated && !suppressRef.current) {
        recordStrike('Tab switch or window minimized');
      }
    };

    const handleWindowBlur = () => {
      if (!isTerminated && !suppressRef.current) {
        recordStrike('Window focus lost (switched application)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, isRulesAgreed, isTerminated, recordStrike]);

  // ── 3. Malicious Keys & DevTools Prevention ──────────────────────────────
  useEffect(() => {
    if (!enabled || !isRulesAgreed) return;

    const handleKeyDown = (e) => {
      if (suppressRef.current) return;

      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        recordStrike('DevTools shortcut blocked (F12)');
        return false;
      }

      // Block Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        recordStrike('Inspect element shortcut blocked');
        return false;
      }

      // Block Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && ['u', 'U'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && ['p', 'P'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e) => {
      if (suppressRef.current) return;
      e.preventDefault();
      return false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [enabled, isRulesAgreed, recordStrike]);

  // Cleanup screen recording on unmount
  useEffect(() => {
    return () => {
      stopScreenRecording();
    };
  }, [stopScreenRecording]);

  return {
    isFullscreen,
    tabSwitchCount,
    maxStrikes: MAX_STRIKES,
    lastViolation,
    showViolationModal,
    setShowViolationModal,
    isTerminated,
    isRulesAgreed,
    setIsRulesAgreed,
    screenStream,
    isScreenRecording,
    proctoringLogs,
    enterFullscreen,
    startScreenRecording,
    stopScreenRecording,
    stopAndGetRecordingBlob,
    recordStrike,
  };
}

export default useAssessmentProctoring;
