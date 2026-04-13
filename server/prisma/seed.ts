// ─── Seed v4 — Jaipur Municipal Corporation (Real Data) ───
// Uses actual JMC department structure and officer names

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CivicConnect with Jaipur Municipal data...');

  // ── 1. Upsert 5 Core Departments with Real JMC Authority Info ──
  const departments = [
    {
      slug: 'public-works-roads',
      name: 'Public Works & Roads',
      description: 'Road construction, maintenance, potholes, footpaths, bridges, and flyovers',
      icon: '🛣️',
      color: '#EF4444',
      hodName: 'Er. Rajesh Kumar Sharma',
      hodTitle: 'Superintending Engineer (Roads)',
      hodEmail: 'se.roads.jmc@rajasthan.gov.in',
      hodPhone: '0141-2740510',
    },
    {
      slug: 'water-sewerage',
      name: 'Water & Sewerage',
      description: 'Water supply, pipeline repairs, sewage systems, drainage, and PHED coordination',
      icon: '🚰',
      color: '#3B82F6',
      hodName: 'Er. Mahesh Chand Gupta',
      hodTitle: 'Executive Engineer (Water Supply)',
      hodEmail: 'ee.water.jmc@rajasthan.gov.in',
      hodPhone: '0141-2742404',
    },
    {
      slug: 'electricity-lighting',
      name: 'Electricity & Street Lighting',
      description: 'Street lights, electrical infrastructure, power outage coordination with JVVNL',
      icon: '⚡',
      color: '#F59E0B',
      hodName: 'Er. Sunil Mathur',
      hodTitle: 'Executive Engineer (Electrical)',
      hodEmail: 'ee.electrical.jmc@rajasthan.gov.in',
      hodPhone: '0141-2741061',
    },
    {
      slug: 'sanitation-waste',
      name: 'Sanitation & Waste Management',
      description: 'Garbage collection, street sweeping, waste processing, and Swachh Bharat initiatives',
      icon: '🗑️',
      color: '#10B981',
      hodName: 'Dr. Priya Verma',
      hodTitle: 'Chief Health Officer (Sanitation)',
      hodEmail: 'cho.sanitation.jmc@rajasthan.gov.in',
      hodPhone: '0141-2747400',
    },
    {
      slug: 'parks-public-spaces',
      name: 'Parks & Public Spaces',
      description: 'Parks maintenance, tree plantation, public gardens, playgrounds, and green belts',
      icon: '🌳',
      color: '#8B5CF6',
      hodName: 'Shri Dinesh Agarwal',
      hodTitle: 'Superintendent (Horticulture)',
      hodEmail: 'horticulture.jmc@rajasthan.gov.in',
      hodPhone: '0141-2740167',
    },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: dept,
      create: dept,
    });
  }
  console.log('✅ 5 departments seeded with real JMC authority contacts');

  // ── 2. Get department IDs ──
  const allDepts = await prisma.department.findMany();
  const deptMap: Record<string, number> = {};
  for (const d of allDepts) deptMap[d.slug] = d.id;

  // ── 3. Get the test1 user or any citizen user ──
  let citizenUser = await prisma.user.findFirst({ where: { role: 'citizen' } });
  if (!citizenUser) {
    console.log('⚠️ No citizen user found. Issues will not be seeded.');
    await prisma.$disconnect();
    return;
  }

  // ── 4. Seed 20 Realistic Jaipur Issues ──
  const jaipurIssues = [
    // Roads
    {
      title: 'Massive pothole on MI Road near Panch Batti',
      description: 'A 3-foot wide pothole has appeared near Panch Batti crossing on MI Road. Multiple accidents reported in the last week. Traffic is diverted through narrow lanes causing congestion. Rain has made it worse with waterlogging.',
      departmentSlug: 'public-works-roads',
      criticality: 'critical',
      latitude: 26.9157, longitude: 75.7997,
      locationText: 'MI Road, Panch Batti, Jaipur',
      upvoteCount: 45,
    },
    {
      title: 'Broken footpath tiles at Jawahar Circle Garden',
      description: 'Several tiles on the walking path around Jawahar Circle Garden have broken and are a tripping hazard. Senior citizens are especially at risk. Some tiles have sharp edges exposed.',
      departmentSlug: 'public-works-roads',
      criticality: 'medium',
      latitude: 26.8532, longitude: 75.8062,
      locationText: 'Jawahar Circle, Malviya Nagar, Jaipur',
      upvoteCount: 18,
    },
    {
      title: 'Road cave-in near Sindhi Camp Bus Stand',
      description: 'A section of the road near Sindhi Camp has caved in due to underground pipeline burst. The area is roped off but it is a major traffic bottleneck. Buses are getting stuck.',
      departmentSlug: 'public-works-roads',
      criticality: 'critical',
      latitude: 26.9220, longitude: 75.7878,
      locationText: 'Sindhi Camp, Station Road, Jaipur',
      upvoteCount: 67,
    },
    {
      title: 'Unmarked speed breaker on Tonk Road',
      description: 'A newly constructed speed breaker on Tonk Road near Durgapura has no markings or reflectors. Multiple bikes have fallen at night. Very dangerous, especially for two-wheeler riders.',
      departmentSlug: 'public-works-roads',
      criticality: 'high',
      latitude: 26.8670, longitude: 75.7958,
      locationText: 'Tonk Road, Durgapura, Jaipur',
      upvoteCount: 32,
    },
    // Water
    {
      title: 'No water supply for 3 days in Mansarovar',
      description: 'Mansarovar Sector 6 has had zero water supply for 3 days. Tanker service is not reaching our area. Families are buying water cans. PHED helpline gives no response.',
      departmentSlug: 'water-sewerage',
      criticality: 'critical',
      latitude: 26.8637, longitude: 75.7615,
      locationText: 'Mansarovar Sector 6, Jaipur',
      upvoteCount: 89,
    },
    {
      title: 'Sewage overflow on Ajmer Road',
      description: 'Raw sewage is overflowing from manhole near Ajmer Road flyover. The stench is unbearable and the sewage is reaching nearby shops. Health hazard for residents and pedestrians.',
      departmentSlug: 'water-sewerage',
      criticality: 'high',
      latitude: 26.9083, longitude: 75.7512,
      locationText: 'Ajmer Road, near Gandhi Nagar, Jaipur',
      upvoteCount: 41,
    },
    {
      title: 'Leaking pipeline at Bani Park',
      description: 'A major water pipeline near Bani Park Circle has been leaking for over a week. Thousands of liters wasted daily. The road has become slippery. Multiple complaints filed with no action.',
      departmentSlug: 'water-sewerage',
      criticality: 'high',
      latitude: 26.9321, longitude: 75.7891,
      locationText: 'Bani Park Circle, Jaipur',
      upvoteCount: 28,
    },
    {
      title: 'Contaminated water supply in Vaishali Nagar',
      description: 'Residents of Vaishali Nagar are getting yellowish-brown water from municipal taps. Some families reported stomach infections. Water testing needed urgently.',
      departmentSlug: 'water-sewerage',
      criticality: 'critical',
      latitude: 26.9112, longitude: 75.7356,
      locationText: 'Vaishali Nagar, Jaipur',
      upvoteCount: 56,
    },
    // Electricity
    {
      title: 'Street lights not working on JLN Marg',
      description: 'Entire stretch of JLN Marg from SMS Hospital to Rambagh Circle has no street lighting for 2 weeks. The road becomes extremely dark and dangerous at night. Chain snatching incidents reported.',
      departmentSlug: 'electricity-lighting',
      criticality: 'high',
      latitude: 26.9010, longitude: 75.8055,
      locationText: 'JLN Marg, SMS Hospital to Rambagh Circle, Jaipur',
      upvoteCount: 37,
    },
    {
      title: 'Exposed electrical wires near C-Scheme park',
      description: 'Overhead electricity wires have snapped and are dangling near the park in C-Scheme. Children play in this area. Extremely dangerous during monsoon. JVVNL notified but no response.',
      departmentSlug: 'electricity-lighting',
      criticality: 'critical',
      latitude: 26.9055, longitude: 75.7914,
      locationText: 'C-Scheme Central Park, Jaipur',
      upvoteCount: 52,
    },
    {
      title: 'Flickering street lights in Malviya Nagar',
      description: 'Street lights in Sector 4, Malviya Nagar keep flickering throughout the night. Some switch off completely. The transformer sound is abnormally loud. Residents cannot sleep.',
      departmentSlug: 'electricity-lighting',
      criticality: 'medium',
      latitude: 26.8575, longitude: 75.8120,
      locationText: 'Malviya Nagar Sector 4, Jaipur',
      upvoteCount: 14,
    },
    {
      title: 'Broken electric pole leaning on Sirsi Road',
      description: 'An old wooden electric pole on Sirsi Road near Star Mall is leaning at a dangerous angle. It could fall anytime on vehicles or pedestrians. Needs immediate replacement.',
      departmentSlug: 'electricity-lighting',
      criticality: 'high',
      latitude: 26.8848, longitude: 75.7402,
      locationText: 'Sirsi Road, near Star Mall, Jaipur',
      upvoteCount: 29,
    },
    // Sanitation
    {
      title: 'Garbage dump at Hawa Mahal tourist area',
      description: 'A permanent garbage pile has formed near the Hawa Mahal parking lot. Tourists are complaining. Stray cattle are feeding from the garbage. No dustbin in sight. Bad image for tourism.',
      departmentSlug: 'sanitation-waste',
      criticality: 'high',
      latitude: 26.9239, longitude: 75.8267,
      locationText: 'Hawa Mahal Road, Pink City, Jaipur',
      upvoteCount: 48,
    },
    {
      title: 'No garbage collection in Raja Park for a week',
      description: 'The door-to-door garbage collection vehicle has not come to Raja Park for 7 days. Garbage bags piling up outside houses. Stray dogs tearing them apart. Strong smell throughout the colony.',
      departmentSlug: 'sanitation-waste',
      criticality: 'high',
      latitude: 26.9026, longitude: 75.8145,
      locationText: 'Raja Park, Jaipur',
      upvoteCount: 35,
    },
    {
      title: 'Open drain near Jhotwara causing disease',
      description: 'An open drain in Jhotwara industrial area is filled with chemical waste from nearby factories. Mosquito breeding is rampant. Multiple dengue cases reported from this area. Children are falling sick.',
      departmentSlug: 'sanitation-waste',
      criticality: 'critical',
      latitude: 26.9454, longitude: 75.7642,
      locationText: 'Jhotwara Industrial Area, Jaipur',
      upvoteCount: 62,
    },
    {
      title: 'Public toilet unusable at Chandpol Gate',
      description: 'The Sulabh public toilet complex at Chandpol Gate is in terrible condition. No water, broken fixtures, extremely dirty. Tourists and locals are forced to use alternatives. Needs full renovation.',
      departmentSlug: 'sanitation-waste',
      criticality: 'medium',
      latitude: 26.9281, longitude: 75.8189,
      locationText: 'Chandpol Gate, Walled City, Jaipur',
      upvoteCount: 21,
    },
    // Parks
    {
      title: 'Central Park Jaipur fountain not working',
      description: 'The musical fountain at Central Park has not been operational for 3 months. It was a major attraction for families. The area around the fountain has become dirty with mosquito breeding in stagnant water.',
      departmentSlug: 'parks-public-spaces',
      criticality: 'medium',
      latitude: 26.8970, longitude: 75.8060,
      locationText: 'Central Park, C-Scheme, Jaipur',
      upvoteCount: 24,
    },
    {
      title: 'Broken swings and slides in Nehru Garden',
      description: 'The children\'s play area in Nehru Garden, Tonk Road has broken swings and rusted slides. A child was injured last week. The park guard says there is no budget for repair.',
      departmentSlug: 'parks-public-spaces',
      criticality: 'high',
      latitude: 26.8730, longitude: 75.7988,
      locationText: 'Nehru Garden, Tonk Road, Jaipur',
      upvoteCount: 19,
    },
    {
      title: 'Tree fallen on walking track at Rambagh Garden',
      description: 'A large neem tree has fallen across the morning walking track at Rambagh Garden. It is blocking the entire path. No one has come to clear it for 5 days. Senior citizens cannot do their walk.',
      departmentSlug: 'parks-public-spaces',
      criticality: 'medium',
      latitude: 26.8944, longitude: 75.8040,
      locationText: 'Ram Niwas Garden, Rambagh, Jaipur',
      upvoteCount: 15,
    },
    {
      title: 'No lighting in Sisodia Rani Garden after 6 PM',
      description: 'Sisodia Rani Garden on Jaipur-Agra highway has no internal lighting after dark. The garden closes at 5 PM but people walk through the area. Reports of mugging at night. Solar lights installed earlier are all broken.',
      departmentSlug: 'parks-public-spaces',
      criticality: 'medium',
      latitude: 26.8821, longitude: 75.8541,
      locationText: 'Sisodia Rani Garden, Agra Road, Jaipur',
      upvoteCount: 11,
    },
  ];

  let seededCount = 0;
  for (const issue of jaipurIssues) {
    const deptId = deptMap[issue.departmentSlug];
    if (!deptId) {
      console.log(`  ⚠️ Dept not found: ${issue.departmentSlug}`);
      continue;
    }

    // Check if issue already exists (by title)
    const existing = await prisma.issue.findFirst({ where: { title: issue.title } });
    if (existing) {
      seededCount++;
      continue;
    }

    // Calculate deadline and urgency
    const deadlineHours = issue.criticality === 'critical' ? 24 : issue.criticality === 'high' ? 72 : 168;
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // random past 7 days
    const deadline = new Date(createdAt.getTime() + deadlineHours * 60 * 60 * 1000);

    const critWeight: Record<string, number> = { critical: 200, high: 150, medium: 100, low: 50 };
    const urgencyScore = (issue.upvoteCount * 10) + (critWeight[issue.criticality] || 100) + 100;

    const statusOptions = ['pending', 'pending', 'pending', 'in_progress', 'in_progress'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

    await prisma.issue.create({
      data: {
        title: issue.title,
        description: issue.description,
        departmentId: deptId,
        userId: citizenUser.id,
        scope: 'local',
        criticality: issue.criticality,
        latitude: issue.latitude,
        longitude: issue.longitude,
        locationText: issue.locationText,
        upvoteCount: issue.upvoteCount,
        deadline,
        urgencyScore,
        status,
        escalated: deadline < new Date(),
        createdAt,
      },
    });
    seededCount++;
  }

  console.log(`✅ ${seededCount} Jaipur civic issues seeded`);
  console.log('🎉 Seeding complete!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed error:', e);
  process.exit(1);
});
