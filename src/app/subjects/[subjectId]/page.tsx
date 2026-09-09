import manifest from "../../../../public/content/manifest.json";
import { SubjectPageClient } from "@/components/subject-page-client";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...new Set(manifest.packages.map((entry) => entry.subjectId))].map((subjectId) => ({ subjectId }));
}

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  return <SubjectPageClient subjectId={decodeURIComponent(subjectId)} />;
}
