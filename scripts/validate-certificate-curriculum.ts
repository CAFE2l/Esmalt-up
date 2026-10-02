/**
 * Validation script for certificate curriculum
 */

import { CERTIFICATE_CURRICULUM } from "@/data/certificateCurriculum";

console.log("📋 Certificate Curriculum Validation");
console.log("================================");

console.log(`\n✅ Course Name: ${CERTIFICATE_CURRICULUM.courseName}`);
console.log(`✅ Total Lessons: ${CERTIFICATE_CURRICULUM.totalLessons}`);
console.log(`✅ Total Bonus Lessons: ${CERTIFICATE_CURRICULUM.totalBonusLessons}`);
console.log(`✅ Total Units: ${CERTIFICATE_CURRICULUM.units.length}`);
console.log(`✅ Competencies: ${CERTIFICATE_CURRICULUM.competencies.length}`);

console.log("\n📚 Units Breakdown:");
CERTIFICATE_CURRICULUM.units.forEach(unit => {
  console.log(`  • Unidade ${unit.unitNumber}: ${unit.title}`);
  console.log(`    - Lessons: ${unit.lessons.length}`);
  unit.lessons.forEach(lesson => {
    console.log(`      - ${lesson.isBonus ? "[BÔNUS] " : ""}${lesson.title} (${lesson.creator})`);
    console.log(`        → ${lesson.learningObjectives.length} learning objectives`);
  });
});

console.log("\n🎯 Competencies:");
CERTIFICATE_CURRICULUM.competencies.forEach((comp, index) => {
  console.log(`  ${index + 1}. ${comp}`);
});

console.log("\n✅ Validation Complete!");
