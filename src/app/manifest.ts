import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TestApp — учебные тесты",
    short_name: "TestApp",
    description: "Автономный тренажёр тестов с научным разбором, ошибками, статистикой и обновляемой базой заданий",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "ru",
    orientation: "portrait-primary",
    categories: ["education", "medical"],
    icons: [
      {
        src: `${BASE_PATH}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `${BASE_PATH}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
