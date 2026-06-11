import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gym Tracker",
    short_name: "Gym Tracker",
    description: "Tracking de rutinas de gimnasio: series, mesociclos, PRs y progresión",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F7FA",
    theme_color: "#F4F7FA",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
