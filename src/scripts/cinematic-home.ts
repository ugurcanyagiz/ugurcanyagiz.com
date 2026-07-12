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

  const setPoster = (): void => {
    poster.style.backgroundImage = `url("${resolvePoster(root, mobileQuery.matches)}")`;
  };

  const showPosterOnly = (): void => {
    root.removeAttribute("data-video-ready");
    root.setAttribute("data-video-failed", "true");
    video.pause();
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
    video.load();
    void video.play().catch(() => {
      if (!disposed) showPosterOnly();
    });
  };

  const markReady = (): void => {
    if (disposed || reducedMotionQuery.matches) return;
    root.setAttribute("data-video-ready", "true");
    root.removeAttribute("data-video-failed");
  };

  const markFailed = (): void => {
    if (disposed) return;
    showPosterOnly();
  };

  const cleanup = (): void => {
    disposed = true;
    video.removeEventListener("loadeddata", markReady);
    video.removeEventListener("canplay", markReady);
    video.removeEventListener("error", markFailed);
    mobileQuery.removeEventListener("change", syncMotionPreference);
    reducedMotionQuery.removeEventListener("change", syncMotionPreference);
    document.removeEventListener("astro:before-swap", cleanup);
    window.removeEventListener("pagehide", cleanup);
  };

  video.addEventListener("loadeddata", markReady, { passive: true });
  video.addEventListener("canplay", markReady, { passive: true });
  video.addEventListener("error", markFailed, { passive: true });
  mobileQuery.addEventListener("change", syncMotionPreference);
  reducedMotionQuery.addEventListener("change", syncMotionPreference);
  document.addEventListener("astro:before-swap", cleanup, { once: true });
  window.addEventListener("pagehide", cleanup, { once: true });

  syncMotionPreference();
}

document.querySelectorAll<CinematicHomeRoot>(ROOT_SELECTOR).forEach(initializeCinematicHome);
