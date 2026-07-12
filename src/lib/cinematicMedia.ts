export const cinematicHomeMedia = {
  desktop: {
    webm: "/media/cinematic/home-desktop.webm",
    mp4: "/media/cinematic/home-desktop.mp4",
    poster: "/images/cinematic-home-poster-desktop.svg",
  },
  mobile: {
    webm: "/media/cinematic/home-mobile.webm",
    mp4: "/media/cinematic/home-mobile.mp4",
    poster: "/images/cinematic-home-poster-mobile.svg",
  },
} as const;

export type CinematicHomeMedia = typeof cinematicHomeMedia;
