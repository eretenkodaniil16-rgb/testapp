import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TestApp — учебные тесты",
    short_name: "TestApp",
    description: "Решение тестов, анализ ошибок и повторение слабых тем",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "ru",
    icons: []
  };
}
