type CinematicHomeRoot = HTMLElement & {
  dataset: DOMStringMap & {
    desktopPoster?: string;
    mobilePoster?: string;
  };
};

const ROOT_SELECTOR = "[data-cinematic-home]";
const VIDEO_SELECTOR = "[data-cinematic-home-video]";
const POSTER_SELECTOR = "[data-cinematic-home-poster]";
const MOBILE_QUERY = "(max-width: 767px), (orientation: portrait)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const RETRY_EVENTS = ["canplay", "visibilitychange"] as const;
const DIAGNOSTIC_VIDEO_EVENTS = ["loadedmetadata", "loadeddata", "canplay", "playing", "stalled", "error"] as const;

function resolvePoster(root: CinematicHomeRoot, isMobile: boolean): string {
  return isMobile
    ? root.dataset.mobilePoster || root.dataset.desktopPoster || ""
    : root.dataset.desktopPoster || root.dataset.mobilePoster || "";
}

function initializeCinematicHome(root: CinematicHomeRoot): void {
  const video = root.querySelector<HTMLVideoElement>(VIDEO_SELECTOR);
  const poster = root.querySelector<HTMLElement>(POSTER_SELECTOR);

  if (!video || !poster) return;

  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  let disposed = false;
  let retryCount = 0;
  const maxPlaybackRetries = RETRY_EVENTS.length;

  const setPoster = (): void => {
    poster.style.backgroundImage = `url("${resolvePoster(root, mobileQuery.matches)}")`;
  };

  const showPosterOnly = (): void => {
    root.removeAttribute("data-video-ready");
    root.setAttribute("data-video-failed", "true");
    video.pause();
  };

  const attemptPlayback = (): void => {
    if (disposed || reducedMotionQuery.matches) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    void video.play().catch((error: unknown) => {
      if (import.meta.env.DEV) {
        console.debug("[cinematic-home] playback attempt rejected", error);
      }
    });
  };

  const retryPlayback = (): void => {
    if (disposed || reducedMotionQuery.matches || retryCount >= maxPlaybackRetries) return;
    retryCount += 1;
    attemptPlayback();
  };

  const retryPlaybackWhenVisible = (): void => {
    if (document.visibilityState === "visible") retryPlayback();
  };

  const syncMotionPreference = (): void => {
    setPoster();

    if (reducedMotionQuery.matches) {
      root.setAttribute("data-reduced-motion", "true");
      showPosterOnly();
      return;
    }

    root.removeAttribute("data-reduced-motion");
    root.removeAttribute("data-video-failed");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.load();
    attemptPlayback();
  };

  const markReady = (): void => {
    if (disposed || reducedMotionQuery.matches) return;
    root.setAttribute("data-video-ready", "true");
    root.removeAttribute("data-video-failed");
  };

  const markFailed = (): void => {
    if (disposed) return;
    console.error("[cinematic-home] video failed", {
      code: video.error?.code,
      currentSrc: video.currentSrc,
    });
    showPosterOnly();
  };

  const logDiagnosticEvent = (event: Event): void => {
    if (!import.meta.env.DEV || event.type === "error") return;
    console.debug(`[cinematic-home] video ${event.type}`, {
      currentSrc: video.currentSrc,
      readyState: video.readyState,
      networkState: video.networkState,
    });
  };

  const cleanup = (): void => {
    disposed = true;
    video.removeEventListener("loadeddata", markReady);
    video.removeEventListener("canplay", markReady);
    video.removeEventListener("canplay", retryPlayback);
    video.removeEventListener("error", markFailed);
    DIAGNOSTIC_VIDEO_EVENTS.forEach((eventName) => video.removeEventListener(eventName, logDiagnosticEvent));
    mobileQuery.removeEventListener("change", syncMotionPreference);
    reducedMotionQuery.removeEventListener("change", syncMotionPreference);
    document.removeEventListener("visibilitychange", retryPlaybackWhenVisible);
    document.removeEventListener("astro:before-swap", cleanup);
    window.removeEventListener("pagehide", cleanup);
  };

  video.addEventListener("loadeddata", markReady, { passive: true });
  video.addEventListener("canplay", markReady, { passive: true });
  video.addEventListener("canplay", retryPlayback, { passive: true });
  video.addEventListener("error", markFailed, { passive: true });
  DIAGNOSTIC_VIDEO_EVENTS.forEach((eventName) => video.addEventListener(eventName, logDiagnosticEvent, { passive: true }));
  mobileQuery.addEventListener("change", syncMotionPreference);
  reducedMotionQuery.addEventListener("change", syncMotionPreference);
  document.addEventListener("visibilitychange", retryPlaybackWhenVisible, { passive: true });
  document.addEventListener("astro:before-swap", cleanup, { once: true });
  window.addEventListener("pagehide", cleanup, { once: true });

  syncMotionPreference();
}

document.querySelectorAll<CinematicHomeRoot>(ROOT_SELECTOR).forEach(initializeCinematicHome);
