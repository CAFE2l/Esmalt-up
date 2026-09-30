import { COURSE_UNITS } from "../data/course";

interface VideoValidationResult {
  unitNumber: number;
  unitTitle: string;
  lessonOrder: number;
  lessonTitle: string;
  youtubeId: string;
  type: string;
  status: "OK" | "NOT_FOUND_404" | "EMBED_DISABLED_401" | "COMING_SOON" | "ERROR";
  statusCode?: number;
  authorName?: string;
  youtubeTitle?: string;
  error?: string;
}

async function validateLesson(
  unitNumber: number,
  unitTitle: string,
  lesson: {
    order: number;
    title: string;
    youtubeId: string;
    type: "video" | "playlist";
    status?: "available" | "coming_soon";
    isBonus?: boolean;
  }
): Promise<VideoValidationResult> {
  const displayTitle = lesson.isBonus ? `[BÔNUS] ${lesson.title}` : lesson.title;

  if (lesson.status === "coming_soon" || !lesson.youtubeId) {
    return {
      unitNumber,
      unitTitle,
      lessonOrder: lesson.order,
      lessonTitle: displayTitle,
      youtubeId: lesson.youtubeId || "N/A",
      type: lesson.type,
      status: "COMING_SOON",
    };
  }

  const endpoint =
    lesson.type === "playlist"
      ? `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${lesson.youtubeId}&format=json`
      : `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${lesson.youtubeId}&format=json`;

  try {
    const res = await fetch(endpoint);
    if (res.status === 404) {
      return {
        unitNumber,
        unitTitle,
        lessonOrder: lesson.order,
        lessonTitle: displayTitle,
        youtubeId: lesson.youtubeId,
        type: lesson.type,
        status: "NOT_FOUND_404",
        statusCode: 404,
        error: "Vídeo excluído ou privado no YouTube (404)",
      };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        unitNumber,
        unitTitle,
        lessonOrder: lesson.order,
        lessonTitle: displayTitle,
        youtubeId: lesson.youtubeId,
        type: lesson.type,
        status: "EMBED_DISABLED_401",
        statusCode: res.status,
        error: `Incorporação desativada ou não autorizada (${res.status})`,
      };
    }
    if (!res.ok) {
      return {
        unitNumber,
        unitTitle,
        lessonOrder: lesson.order,
        lessonTitle: displayTitle,
        youtubeId: lesson.youtubeId,
        type: lesson.type,
        status: "ERROR",
        statusCode: res.status,
        error: `Resposta HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      unitNumber,
      unitTitle,
      lessonOrder: lesson.order,
      lessonTitle: displayTitle,
      youtubeId: lesson.youtubeId,
      type: lesson.type,
      status: "OK",
      statusCode: 200,
      authorName: data.author_name,
      youtubeTitle: data.title,
    };
  } catch (err: any) {
    return {
      unitNumber,
      unitTitle,
      lessonOrder: lesson.order,
      lessonTitle: displayTitle,
      youtubeId: lesson.youtubeId,
      type: lesson.type,
      status: "ERROR",
      error: err.message,
    };
  }
}

async function main() {
  console.log("==================================================================");
  console.log("  ESMALT'UP — VALIDAÇÃO DE VÍDEOS DO CURSO (YouTube oEmbed)       ");
  console.log("==================================================================\n");

  const results: VideoValidationResult[] = [];

  for (const unit of COURSE_UNITS) {
    console.log(`\n▶ UNIDADE ${unit.unitNumber}: ${unit.title} (${unit.subtitle})`);
    console.log("------------------------------------------------------------------");

    for (const lesson of unit.lessons) {
      const res = await validateLesson(unit.unitNumber, unit.title, lesson);
      results.push(res);
      printResult(res);
    }

    if (unit.bonusChest) {
      const bonusRes = await validateLesson(unit.unitNumber, unit.title, unit.bonusChest.lesson);
      results.push(bonusRes);
      printResult(bonusRes);
    }
  }

  // Summary
  console.log("\n==================================================================");
  console.log("  RESUMO DO RELATÓRIO DE VALIDAÇÃO");
  console.log("==================================================================");
  const total = results.length;
  const okCount = results.filter((r) => r.status === "OK").length;
  const comingSoonCount = results.filter((r) => r.status === "COMING_SOON").length;
  const notFoundCount = results.filter((r) => r.status === "NOT_FOUND_404").length;
  const embedDisabledCount = results.filter((r) => r.status === "EMBED_DISABLED_401").length;
  const errorCount = results.filter((r) => r.status === "ERROR").length;

  console.log(`Total de aulas analisadas: ${total}`);
  console.log(`✓ Disponíveis e ativas (200 OK): ${okCount}`);
  console.log(`⏳ Em breve (sem vídeo):         ${comingSoonCount}`);
  console.log(`✕ Excluídos / Privados (404):    ${notFoundCount}`);
  console.log(`🔒 Embed desativado (401/403):   ${embedDisabledCount}`);
  console.log(`⚠️ Erros de conexão:             ${errorCount}`);

  if (notFoundCount > 0 || embedDisabledCount > 0) {
    console.log("\n⚠️ AULAS COM PROBLEMAS IDENTIFICADAS:");
    results
      .filter((r) => r.status === "NOT_FOUND_404" || r.status === "EMBED_DISABLED_401")
      .forEach((r) => {
        console.log(`  - [Unidade ${r.unitNumber}] Aula: "${r.lessonTitle}" (ID: ${r.youtubeId}) -> ${r.error}`);
      });
  }

  console.log("\nFim do relatório.\n");
}

function printResult(r: VideoValidationResult) {
  const icon =
    r.status === "OK"
      ? "✓"
      : r.status === "COMING_SOON"
      ? "⏳"
      : r.status === "NOT_FOUND_404"
      ? "✕ [404]"
      : r.status === "EMBED_DISABLED_401"
      ? "🔒 [401]"
      : "⚠️";

  console.log(
    ` ${icon.padEnd(8)} ${r.lessonTitle.slice(0, 45).padEnd(47)} | ${r.youtubeId.padEnd(12)} | Criador: ${
      r.authorName || (r.status === "COMING_SOON" ? "Esmalt'up (Em breve)" : "Indisponível")
    }`
  );
}

main().catch((err) => {
  console.error("Erro na execução da validação:", err);
  process.exit(1);
});
