import { redirect } from "next/navigation";

export default async function PecasRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/produto/${slug}`);
}