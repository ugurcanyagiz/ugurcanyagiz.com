export type CinematicVideoVariant = {
  poster: string;
  objectPosition: string;
};

export const cinematicHomeMedia = {
  desktop: {
    poster: "/images/cinematic-home-poster-desktop.svg",
    objectPosition: "center center",
  },
  mobile: {
    poster: "/images/cinematic-home-poster-mobile.svg",
    objectPosition: "center center",
  },
} as const satisfies {
  desktop: CinematicVideoVariant;
  mobile: CinematicVideoVariant;
};

export type CinematicHomeMedia = typeof cinematicHomeMedia;
