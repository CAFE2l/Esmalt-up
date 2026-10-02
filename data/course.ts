export type LessonType = "video" | "playlist";

export interface CourseLesson {
  id: string;
  slug: string;
  title: string;
  youtubeId: string;
  creator: string;
  type: LessonType;
  unitId: string;
  order: number;
  description?: string;
  isBonus?: boolean;
  status?: "available" | "coming_soon";
}

export interface BonusChest {
  id: string;
  title: string;
  subtitle: string;
  lesson: CourseLesson;
}

export interface CourseUnit {
  id: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  accentColor: string;
  headerBg: string;
  lessons: CourseLesson[];
  bonusChest?: BonusChest;
}

export const COURSE_UNITS: CourseUnit[] = [
  {
    id: "unit-1",
    unitNumber: 1,
    title: "Começando do zero",
    subtitle: "Materiais, unha e segurança",
    accentColor: "#E09CAA", // rosa-blush
    headerBg: "rgba(224, 156, 170, 0.12)",
    lessons: [
      {
        id: "u1-l1",
        slug: "lista-de-materiais-para-manicure-iniciante",
        title: "Lista de materiais para manicure iniciante",
        youtubeId: "u7SX-dLUDxI",
        creator: "Malukas por esmaltes",
        type: "video",
        unitId: "unit-1",
        order: 1,
        description: "Descubra quais materiais realmente comprar para começar sem gastar à toa.",
      },
      {
        id: "u1-l2",
        slug: "materiais-essenciais-para-comecar-na-profissao",
        title: "Materiais essenciais para começar na profissão",
        youtubeId: "M5ntCVA7tM0",
        creator: "Milena Klunck",
        type: "video",
        unitId: "unit-1",
        order: 2,
        description: "Guia completo dos itens essenciais para iniciar seus primeiros atendimentos.",
      },
      {
        id: "u1-l3",
        slug: "materiais-que-fazem-diferenca-no-atendimento",
        title: "Materiais que fazem diferença no atendimento",
        youtubeId: "ry_WyxgawuE",
        creator: "Fram Alves_unhas",
        type: "video",
        unitId: "unit-1",
        order: 3,
        description: "Dicas de produtos e ferramentas que agilizam e elevam o nível do seu serviço.",
      },
      {
        id: "u1-l4",
        slug: "anatomia-da-unha",
        title: "Anatomia da unha",
        youtubeId: "_8gDy8IXxM0",
        creator: "Rafaela Filha",
        type: "video",
        unitId: "unit-1",
        order: 4,
        description: "Aprenda a estrutura biológica da unha para trabalhar com total segurança.",
      },
      {
        id: "u1-l5",
        slug: "esterilizacao-para-manicures-dicas",
        title: "Esterilização para manicures (dicas)",
        youtubeId: "hqneGbP_UIg",
        creator: "Cristófoli Biossegurança",
        type: "video",
        unitId: "unit-1",
        order: 5,
        description: "Normas de biossegurança fundamentais para proteger você e suas clientes.",
      },
      {
        id: "u1-l6",
        slug: "como-esterilizar-alicate-e-espatulas",
        title: "Como esterilizar alicate e espátulas",
        youtubeId: "foJ6LHS9BoA",
        creator: "JÉSSICA'S NAIL CENTER",
        type: "video",
        unitId: "unit-1",
        order: 6,
        description: "Passo a passo correto para higienizar e esterilizar ferramentas metálicas.",
      },
    ],
    bonusChest: {
      id: "chest-1",
      title: "Baú Bônus: Esterilização Avançada",
      subtitle: "Esterilização com autoclave, passo a passo",
      lesson: {
        id: "u1-bonus",
        slug: "bonus-esterilizacao-com-autoclave-passo-a-passo",
        title: "Esterilização com autoclave, passo a passo",
        youtubeId: "3pDgN804Ee8",
        creator: "Talita Cardozo",
        type: "video",
        unitId: "unit-1",
        order: 7,
        isBonus: true,
        description: "Aula bônus exclusiva: domine o uso correto da autoclave no seu espaço.",
      },
    },
  },
  {
    id: "unit-2",
    unitNumber: 2,
    title: "Cutilagem e esmaltação",
    subtitle: "Mãos e pés com acabamento profissional",
    accentColor: "#D396A0", // rose-gold
    headerBg: "rgba(211, 150, 160, 0.12)",
    lessons: [
      {
        id: "u2-l1",
        slug: "cutilagem-e-esmaltacao-aula-completa",
        title: "Cutilagem e esmaltação (aula completa)",
        youtubeId: "F5eBW4CCKek",
        creator: "Faby Cardoso",
        type: "video",
        unitId: "unit-2",
        order: 1,
        description: "Aprenda a cutilagem fundinha e a esmaltação uniforme passo a passo.",
      },
      {
        id: "u2-l2",
        slug: "como-fazer-as-unhas-passo-a-passo-para-iniciantes",
        title: "Como fazer as unhas - passo a passo para iniciantes",
        youtubeId: "KMILSpZe7p4",
        creator: "Laura Kuczynski",
        type: "video",
        unitId: "unit-2",
        order: 2,
        description: "Técnicas práticas e didáticas para dominar o cuidado com as mãos.",
      },
      {
        id: "u2-l3",
        slug: "esmaltacao-clarinha-nas-maos",
        title: "Esmaltação clarinha nas mãos",
        youtubeId: "pdfaM0jZIxA",
        creator: "Faby Cardoso",
        type: "video",
        unitId: "unit-2",
        order: 3,
        description: "O segredo para passar esmalte claro e branco sem manchar.",
      },
      {
        id: "u2-l4",
        slug: "aula-de-unhas-para-manicure-iniciante",
        title: "Aula de unhas para manicure iniciante",
        youtubeId: "ai129sl4BBI",
        creator: "RRENAILS ACADEMY",
        type: "video",
        unitId: "unit-2",
        order: 4,
        description: "Treinamento essencial de posicionamento das mãos, lixamento e cutículas.",
      },
      {
        id: "u2-l5",
        slug: "pedicure-completo-dicas-iniciantes",
        title: "Pedicure completo",
        youtubeId: "RgSN6v8xX-k",
        creator: "Fram Alves_unhas",
        type: "video",
        unitId: "unit-2",
        order: 5,
        description: "Atendimento de pedicure com cutilagem suave e esmaltação duradoura.",
      },
    ],
  },
  {
    id: "unit-3",
    unitNumber: 3,
    title: "Nail art e decoração",
    subtitle: "Francesinha e unhas decoradas",
    accentColor: "#E28FA0",
    headerBg: "rgba(226, 143, 160, 0.12)",
    lessons: [
      {
        id: "u3-l1",
        slug: "francesinha-facil-varias-tecnicas",
        title: "Francesinha fácil - várias técnicas",
        youtubeId: "cuSnQSQBog8",
        creator: "Gabriela Becker",
        type: "video",
        unitId: "unit-3",
        order: 1,
        description: "Aprenda múltiplos métodos para fazer o traço da francesinha perfeito.",
      },
      {
        id: "u3-l2",
        slug: "unhas-decoradas-com-francesinha",
        title: "Unhas decoradas com francesinha",
        youtubeId: "PhvVvJqfV6o",
        creator: "YouTube",
        type: "video",
        unitId: "unit-3",
        order: 2,
        description: "Combinações delicadas de francesinha e arte nas unhas.",
      },
      {
        id: "u3-l3",
        slug: "15-unhas-decoradas-com-passo-a-passo",
        title: "15 unhas decoradas com passo a passo",
        youtubeId: "2WUUzuLT7Js",
        creator: "Gabriela Becker",
        type: "video",
        unitId: "unit-3",
        order: 3,
        description: "15 ideias rápidas e comerciais de nail art para encantar clientes.",
      },
      {
        id: "u3-l4",
        slug: "nail-art-3d-para-iniciantes",
        title: "Nail art 3D para iniciantes",
        youtubeId: "NkhHth7TZ0Q",
        creator: "Cola na Villar",
        type: "video",
        unitId: "unit-3",
        order: 4,
        description: "Técnicas 3D simplificadas para criar relevos e decorações modernas.",
      },
    ],
  },
  {
    id: "unit-4",
    unitNumber: 4,
    title: "Unhas de gel",
    subtitle: "Do material ao alongamento",
    accentColor: "#C98991",
    headerBg: "rgba(201, 137, 145, 0.12)",
    lessons: [
      {
        id: "u4-l1",
        slug: "lista-de-materiais-iniciantes-unha-de-gel-tip",
        title: "Lista de materiais para iniciantes - unha de gel na tip",
        youtubeId: "3LinjeE9xgo",
        creator: "Maynara Matias",
        type: "video",
        unitId: "unit-4",
        order: 1,
        description: "O checklist completo de cabine, géis, preparadores e tips.",
      },
      {
        id: "u4-l2",
        slug: "materiais-alongamento-fibra-de-vidro-e-tip",
        title: "Materiais para alongamento em fibra de vidro e tip",
        youtubeId: "9bOpiH_IFeY",
        creator: "Rafaela Filha",
        type: "video",
        unitId: "unit-4",
        order: 2,
        description: "Diferenças entre técnicas de fibra e tip, e quais produtos escolher.",
      },
      {
        id: "u4-l3",
        slug: "como-fazer-unhas-de-gel-em-casa",
        title: "Como fazer unhas de gel em casa",
        youtubeId: "u9ZkaRx26K8",
        creator: "Isabele Nail Designer",
        type: "video",
        unitId: "unit-4",
        order: 3,
        description: "Aprenda a preparação da lâmina, ponto de tensão e cura na cabine.",
      },
      {
        id: "u4-l4",
        slug: "unha-de-gel-com-tip-tutorial-completo",
        title: "Unha de gel com tip - tutorial completo",
        youtubeId: "7UfdArJvUPM",
        creator: "Mundo Nails Por Monique Oliveira",
        type: "video",
        unitId: "unit-4",
        order: 4,
        description: "Passo a passo completo de aplicação, corte, nivelamento e acabamento.",
      },
    ],
    bonusChest: {
      id: "chest-4",
      title: "Baú Bônus: Maratona Unhas de Gel",
      subtitle: "Curso de unhas de gel para iniciantes (Playlist Completa)",
      lesson: {
        id: "u4-bonus",
        slug: "bonus-curso-de-unhas-de-gel-para-iniciantes",
        title: "Curso de unhas de gel para iniciantes",
        youtubeId: "PLV7_IvQZcRDlcFqtuaWOkqlMIyFGhGKB3",
        creator: "Universo das Unhas com Jessica Bovolenta",
        type: "playlist",
        unitId: "unit-4",
        order: 5,
        isBonus: true,
        description: "Playlist especial completa com módulos práticos para aprofundar sua técnica.",
      },
    },
  },
  {
    id: "unit-5",
    unitNumber: 5,
    title: "Sua carreira",
    subtitle: "Conquiste clientes e lote sua agenda",
    accentColor: "#DF9AA8",
    headerBg: "rgba(223, 154, 168, 0.12)",
    lessons: [
      {
        id: "u5-l1",
        slug: "como-conquistar-mais-clientes",
        title: "Como conquistar mais clientes",
        youtubeId: "VkUhnIVEd_A",
        creator: "Faby Cardoso",
        type: "video",
        unitId: "unit-5",
        order: 1,
        description: "Estratégias de fidelização e captação de clientes para manicure.",
      },
      {
        id: "u5-l2",
        slug: "3-dicas-para-conseguir-mais-clientes",
        title: "3 dicas para conseguir mais clientes",
        youtubeId: "HXoCaHPOPbU",
        creator: "Fabiana Lima",
        type: "video",
        unitId: "unit-5",
        order: 2,
        description: "Como usar redes sociais, indicações e atendimento para encher a agenda.",
      },
      {
        id: "u5-l3",
        slug: "o-segredo-para-atrair-clientes-e-lotar-a-agenda",
        title: "O segredo para atrair clientes e lotar a agenda",
        youtubeId: "Z5AwSMSBXec",
        creator: "RRENAILS ACADEMY",
        type: "video",
        unitId: "unit-5",
        order: 3,
        description: "Posicionamento profissional que transforma clientes esporádicas em fixas.",
      },
      {
        id: "u5-l4",
        slug: "precificacao-dos-servicos",
        title: "Precificação dos serviços",
        youtubeId: "sNaJEu9Wsng",
        creator: "Janaina Rodrigues",
        type: "video",
        unitId: "unit-5",
        order: 4,
        description: "Aprenda a calcular seus custos, margem de lucro e preço ideal dos serviços.",
      },
    ],
  },
];

/** Return all regular lessons and bonus lessons in sequence */
export function getAllLessons(): CourseLesson[] {
  const result: CourseLesson[] = [];
  for (const unit of COURSE_UNITS) {
    result.push(...unit.lessons);
    if (unit.bonusChest) {
      result.push(unit.bonusChest.lesson);
    }
  }
  return result;
}

/** Return only main curriculum lessons (excluding bonus and coming-soon) */
export function getMainTrackLessons(): CourseLesson[] {
  const result: CourseLesson[] = [];
  for (const unit of COURSE_UNITS) {
    for (const l of unit.lessons) {
      if (l.status !== "coming_soon") {
        result.push(l);
      }
    }
  }
  return result;
}

export function getLessonBySlug(slug: string): CourseLesson | undefined {
  const all = getAllLessons();
  return all.find((l) => l.slug === slug);
}

export function getLessonById(id: string): CourseLesson | undefined {
  const all = getAllLessons();
  return all.find((l) => l.id === id);
}

export function getUnitById(unitId: string): CourseUnit | undefined {
  return COURSE_UNITS.find((u) => u.id === unitId);
}

export function getUnitOfLesson(lesson: CourseLesson): CourseUnit | undefined {
  return COURSE_UNITS.find((u) => u.id === lesson.unitId);
}

export function getNextLesson(currentSlug: string): CourseLesson | undefined {
  const all = getAllLessons().filter((l) => l.status !== "coming_soon");
  const idx = all.findIndex((l) => l.slug === currentSlug);
  if (idx >= 0 && idx < all.length - 1) {
    return all[idx + 1];
  }
  return undefined;
}

export function getPrevLesson(currentSlug: string): CourseLesson | undefined {
  const all = getAllLessons().filter((l) => l.status !== "coming_soon");
  const idx = all.findIndex((l) => l.slug === currentSlug);
  if (idx > 0) {
    return all[idx - 1];
  }
  return undefined;
}
