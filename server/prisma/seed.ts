// ─── Database Seed Script ───
// Run with: npm run db:seed
// Populates departments table and creates sample issues for development.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Water Department', slug: 'water', icon: '🚰', color: '#0EA5E9', description: 'Water supply, leaks, contamination, drainage, flooding' },
  { name: 'Roads & Infrastructure', slug: 'roads', icon: '🛣️', color: '#F59E0B', description: 'Potholes, road damage, sidewalks, bridges, unpaved roads' },
  { name: 'Electricity', slug: 'electricity', icon: '⚡', color: '#EAB308', description: 'Streetlights, power outages, exposed wires, transformers' },
  { name: 'Sanitation & Waste', slug: 'sanitation', icon: '🗑️', color: '#10B981', description: 'Garbage collection, drains, illegal dumping, sewage' },
  { name: 'Traffic & Transport', slug: 'traffic', icon: '🚦', color: '#EF4444', description: 'Traffic signals, parking, highway issues, toll booths' },
  { name: 'Urban Development', slug: 'urban', icon: '🏗️', color: '#8B5CF6', description: 'Construction safety, building violations, encroachment' },
  { name: 'Parks & Environment', slug: 'parks', icon: '🌳', color: '#22C55E', description: 'Parks, trees, pollution, stray animals, deforestation' },
  { name: 'General Administration', slug: 'general', icon: '📋', color: '#6B7280', description: 'Policy suggestions, miscellaneous civic issues' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert departments (idempotent — safe to run multiple times)
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: { name: dept.name, icon: dept.icon, color: dept.color, description: dept.description },
      create: dept,
    });
  }
  console.log(`✅ ${DEPARTMENTS.length} departments seeded`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
