export type CinematicVideoFormat = {
  src?: string;
  type: "video/mp4" | "video/webm";
};

export type CinematicVideoVariant = {
  webm?: string;
  mp4?: string;
  poster: string;
  objectPosition: string;
};

export const cinematicHomeMedia = {
  desktop: {
    mp4: "/back.mp4",
    poster: "/images/cinematic-home-poster-desktop.svg",
    objectPosition: "center center",
  },
  mobile: {
    mp4: "/back.mp4",
    poster: "/images/cinematic-home-poster-mobile.svg",
    objectPosition: "center center",
  },
} as const satisfies {
  desktop: CinematicVideoVariant;
  mobile: CinematicVideoVariant;
};

export type CinematicHomeMedia = typeof cinematicHomeMedia;
