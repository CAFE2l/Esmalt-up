import { redirect } from "next/navigation";

/** /desejos foi renomeado para /favoritos — mantém links antigos funcionando. */
export default function DesejosRedirectPage() {
  redirect("/favoritos");
}
