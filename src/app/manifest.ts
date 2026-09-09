import type { MetadataRoute } from "next";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TestApp — учебные тесты",
    short_name: "TestApp",
    description: "Решение тестов, анализ ошибок и повторение слабых тем",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "ru",
    icons: [],
  };
}
