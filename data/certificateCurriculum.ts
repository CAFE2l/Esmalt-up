/**
 * Certificate Curriculum Data for Nail Designer Iniciante
 * Generated from actual course data in /data/course.ts
 * This is the source of truth for the certificate back side content
 */

export interface CurriculumLesson {
  id: string;
  slug: string;
  title: string;
  creator: string;
  order: number;
  isBonus: boolean;
  learningObjectives: string[]; // "O que você aprendeu" bullet points
}

export interface CurriculumUnit {
  unitNumber: number;
  title: string;
  subtitle: string;
  lessons: CurriculumLesson[];
}

export interface CertificateCurriculum {
  courseName: string;
  units: CurriculumUnit[];
  competencies: string[]; // "Competências desenvolvidas"
  totalLessons: number;
  totalBonusLessons: number;
}

// Learning objectives based on lesson titles and descriptions
// Written in professional Brazilian Portuguese, starting with verbs
const LESSON_OBJECTIVES: Record<string, string[]> = {
  // Unit 1 - Começando do zero
  "u1-l1": [
    "Identificar os materiais essenciais para iniciar na manicure sem desperdícios.",
    "Selecionar ferramentas de qualidade com orçamento controlado.",
  ],
  "u1-l2": [
    "Aplicar critérios para escolher itens fundamentais para o primeiro atendimento.",
    "Organizar o kit básico de manicure profissional.",
  ],
  "u1-l3": [
    "Reconhecer produtos e ferramentas que otimizam o atendimento.",
    "Incorporar dicas práticas para elevar o padrão do serviço.",
  ],
  "u1-l4": [
    "Compreender a estrutura biológica da unha.",
    "Aplicar conhecimentos de anatomia para trabajar com segurança.",
  ],
  "u1-l5": [
    "Implementar normas de biossegurança fundamentais.",
    "Proteger cliente e profissional durante os procedimentos.",
  ],
  "u1-l6": [
    "Esterilizar ferramentas metálicas de forma correta.",
    "Dominar o passo a passo de higienização de alicates e espátulas.",
  ],
  "u1-bonus": [
    "Operar autoclave com segurança e eficiência.",
    "Aplicar protocolos avançados de esterilização no ambiente de trabalho.",
  ],

  // Unit 2 - Cutilagem e esmaltação
  "u2-l1": [
    "Realizar cutilagem fundinha com precisão.",
    "Aplicar esmalte de forma uniforme e profissional.",
  ],
  "u2-l2": [
    "Dominar técnicas práticas para cuidado com as mãos.",
    "Aplicar métodos didáticos para manicure iniciantes.",
  ],
  "u2-l3": [
    "Passar esmalte claro e branco sem manchas.",
    "Executar esmaltação limpa em tons transparentes.",
  ],
  "u2-l4": [
    "Adotar posicionamento correto das mãos.",
    "Aplicar técnicas de lixamento e cuidado com cutículas.",
  ],
  "u2-l5": [
    "Realizar pedicure completo com cutilagem suave.",
    "Garantir esmaltação duradoura nos pés.",
  ],

  // Unit 3 - Nail art e decoração
  "u3-l1": [
    "Aplicar múltiplos métodos para traçar francesinha perfeita.",
    "Dominar diversas técnicas de nail art básica.",
  ],
  "u3-l2": [
    "Combinar francesinha com decorações delicadas.",
    "Criar harmonizações visuais em unhas decoradas.",
  ],
  "u3-l3": [
    "Reproduzir 15 ideias rápidas de nail art.",
    "Aplicar técnicas comerciais para encantar clientes.",
  ],
  "u3-l4": [
    "Criar relevos e decorações modernas com nail art 3D.",
    "Aplicar técnicas 3D simplificadas para iniciantes.",
  ],

  // Unit 4 - Unhas de gel
  "u4-l1": [
    "Montar checklist completo para unha de gel na tip.",
    "Selecionar cabine, géis, preparadores e tips essenciais.",
  ],
  "u4-l2": [
    "Diferenciar técnicas de fibra de vidro e tip.",
    "Escolher os produtos adequados para cada técnica de alongamento.",
  ],
  "u4-l3": [
    "Preparar lâmina e ponto de tensão corretamente.",
    "Realizar cura na cabine com segurança.",
  ],
  "u4-l4": [
    "Aplicar passo a passo completo de unha de gel com tip.",
    "Dominar aplicação, corte, nivelamento e acabamento.",
  ],
  "u4-bonus": [
    "Aprofundar técnicas práticas de unha de gel.",
    "Dominar módulos completos de alongamento em gel.",
  ],

  // Unit 5 - Sua carreira
  "u5-l1": [
    "Implementar estratégias de fidelização de clientes.",
    "Captar novos clientes para manicure.",
  ],
  "u5-l2": [
    "Utilizar redes sociais para divulgação.",
    "Aproveitar indicações para encher a agenda.",
  ],
  "u5-l3": [
    "Adotar posicionamento profissional que transforma clientes esporádicas em fixas.",
    "Aplicar técnicas de atendimento para lotar a agenda.",
  ],
};

// Build curriculum from course data
function buildCertificateCurriculum(): CertificateCurriculum {
  const { COURSE_UNITS } = require("@/data/course");

  const units: CurriculumUnit[] = [];
  let totalLessons = 0;
  let totalBonus = 0;

  for (const unit of COURSE_UNITS) {
    const unitLessons: CurriculumLesson[] = [];

    // Process regular lessons
    for (const lesson of unit.lessons) {
      // Skip coming soon lessons
      if (lesson.status === "coming_soon") continue;

      const objectives = LESSON_OBJECTIVES[lesson.id] || [
        `Dominar os conceitos de: ${lesson.title}.`,
      ];

      unitLessons.push({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        creator: lesson.creator,
        order: lesson.order,
        isBonus: false,
        learningObjectives: objectives,
      });
      totalLessons++;
    }

    // Process bonus chest if present
    if (unit.bonusChest) {
      const bonusLesson = unit.bonusChest.lesson;
      const objectives = LESSON_OBJECTIVES[bonusLesson.id] || [
        `Aprofundar conhecimentos em: ${bonusLesson.title}.`,
      ];

      unitLessons.push({
        id: bonusLesson.id,
        slug: bonusLesson.slug,
        title: bonusLesson.title,
        creator: bonusLesson.creator,
        order: bonusLesson.order,
        isBonus: true,
        learningObjectives: objectives,
      });
      totalLessons++;
      totalBonus++;
    }

    units.push({
      unitNumber: unit.unitNumber,
      title: unit.title,
      subtitle: unit.subtitle,
      lessons: unitLessons,
    });
  }

  // Competencies developed across the whole course
  const competencies = [
    "Identificar e seleccionar materiais essenciais para manicure e pedicure.",
    "Aplicar normas de biossegurança e esterilização profissional.",
    "Realizar cutilagem e esmaltação em mãos e pés com precisão.",
    "Criar nail art e francesinha com técnicas variadas.",
    "Trabalhar com unhas de gel, fibra de vidro e tip.",
    "Desenvolver estratégias de marketing para atrair e fidelizar clientes.",
    "Gerenciar agenda e precificar serviços de forma competitiva.",
  ];

  return {
    courseName: "Nail Designer Iniciante",
    units,
    competencies,
    totalLessons,
    totalBonusLessons: totalBonus,
  };
}

// Export the curriculum
export const CERTIFICATE_CURRICULUM = buildCertificateCurriculum();

// Also export as a function for dynamic generation if needed
export function getCertificateCurriculum(): CertificateCurriculum {
  return CERTIFICATE_CURRICULUM;
}
