import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const levels = [
  {
    name: "Creche",
    slug: "creche",
    sortOrder: 1,
    ageRange: "0 – 2 years",
    tagline: "A safe, caring start",
    description:
      "Our creche provides a warm, secure and stimulating environment where our youngest children are cared for by attentive and qualified staff.",
    highlights: "Safe, supervised care|Play-based early learning|Healthy routine & rest",
  },
  {
    name: "Kindergarten",
    slug: "kindergarten",
    sortOrder: 2,
    ageRange: "Age 3",
    tagline: "Learning through play",
    description:
      "Kindergarten introduces structured play and early learning that builds confidence, curiosity and the first steps in literacy and numeracy.",
    highlights: "Early literacy & numeracy|Creative play|Social skills & confidence",
  },
  {
    name: "Nursery",
    slug: "nursery",
    sortOrder: 3,
    ageRange: "Ages 4 – 5",
    tagline: "Foundations for the future",
    description:
      "Our nursery programme develops foundational academic skills while nurturing independence, good character and a love of learning.",
    highlights: "Phonics & early reading|Foundation numeracy|Character & independence",
  },
  {
    name: "Primary",
    slug: "primary",
    sortOrder: 4,
    ageRange: "Ages 6 – 11",
    tagline: "A strong academic base",
    description:
      "The primary school delivers a well-rounded curriculum that builds strong academic foundations, critical thinking and a range of creative, sporting and life skills.",
    highlights: "Core curriculum coverage|STEM & ICT|Arts, sports & life skills",
  },
  {
    name: "Secondary",
    slug: "secondary",
    sortOrder: 5,
    ageRange: "Ages 12+",
    tagline: "Preparing confident learners",
    description:
      "Our secondary programme prepares students for the next stage of their education with focused subject teaching, study skills and confidence building.",
    highlights: "Specialised subject teaching|Study & exam preparation|Leadership & character",
  },
];

const settings: { key: string; value: string }[] = [
  { key: "school.name", value: "STAR DreamWorks Schools" },
  { key: "school.tagline", value: "Caring Nursery, Primary & JSS" },
  { key: "school.location", value: "Ajah, Lagos, Nigeria" },
  { key: "school.phone", value: "" },
  { key: "school.email", value: "" },
  { key: "admissions.status", value: "open" },
  {
    key: "admissions.message",
    value:
      "Applications are open for Creche, Kindergarten, Nursery, Primary and Secondary School. Please reach out to the school office for enquiries.",
  },
  { key: "homepage.introTitle", value: "Welcome to STAR DreamWorks Schools" },
  {
    key: "homepage.introBody",
    value:
      "STAR DreamWorks Schools is a caring nursery, primary and junior secondary school in Ajah, Lagos. We combine strong academics with good character, giving every child the foundation they need to thrive.",
  },
];

async function main() {
  console.log("🌱 Seeding site content (levels + settings)...");

  for (const l of levels) {
    await prisma.educationalLevel.upsert({
      where: { slug: l.slug },
      update: {
        name: l.name,
        sortOrder: l.sortOrder,
        ageRange: l.ageRange,
        tagline: l.tagline,
        description: l.description,
        highlights: l.highlights,
        isActive: true,
      },
      create: l,
    });
  }
  console.log(`✅ Upserted ${levels.length} educational levels`);

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, isPublic: true },
      create: { ...s, isPublic: true },
    });
  }
  console.log(`✅ Upserted ${settings.length} site settings`);

  // Remove fabricated sample content so the site shows honest empty states.
  const nc = await prisma.news.deleteMany({});
  const ec = await prisma.event.deleteMany({});
  const gc = await prisma.galleryItem.deleteMany({});
  const ac = await prisma.announcement.deleteMany({});
  console.log(
    `🗑️  Removed fabricated content: ${nc.count} news, ${ec.count} events, ${gc.count} gallery, ${ac.count} announcements`
  );

  console.log("🎉 Site content seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during content seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
