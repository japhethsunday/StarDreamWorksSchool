import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (in dependency order)
  await prisma.$transaction([
    prisma.submission.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.learningMaterial.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.news.deleteMany(),
    prisma.event.deleteMany(),
    prisma.galleryItem.deleteMany(),
    prisma.parentStudent.deleteMany(),
    prisma.teacherClass.deleteMany(),
    prisma.teacherSubject.deleteMany(),
    prisma.classSubject.deleteMany(),
    prisma.parent.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.class.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("🗑️  Cleared existing data");

  // ---------- ADMIN ----------
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@stardreamworks.edu",
      password: adminPassword,
      name: "System Administrator",
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // ---------- SUBJECTS ----------
  const subjectsData = [
    { name: "Mathematics", code: "MATH", description: "Core mathematics for all levels", level: "NURSERY" },
    { name: "English", code: "ENG", description: "English language and literature", level: "NURSERY" },
    { name: "Science", code: "SCN", description: "Basic and integrated science", level: "PRIMARY" },
    { name: "Social Studies", code: "SST", description: "Civic and social education", level: "PRIMARY" },
    { name: "Creative Arts", code: "CRT", description: "Arts, crafts and music", level: "JSS" },
    { name: "Physical Education", code: "PHE", description: "Sports and physical fitness", level: "JSS" },
  ];

  const subjects: Record<string, any> = {};
  for (const s of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        name: s.name,
        code: s.code,
        description: s.description,
        level: s.level,
      },
    });
    subjects[s.code] = subject;
  }
  console.log(`✅ Created ${subjectsData.length} subjects`);

  // ---------- TEACHERS ----------
  const teachersData = [
    {
      firstName: "Grace",
      lastName: "Okafor",
      email: "grace.okafor@stardreamworks.edu",
      password: "teacher123",
      phone: "+2348012345678",
      qualification: "B.Ed Mathematics",
      specialization: "Mathematics",
    },
    {
      firstName: "Emeka",
      lastName: "Bello",
      email: "emeka.bello@stardreamworks.edu",
      password: "teacher123",
      phone: "+2348023456789",
      qualification: "B.A English",
      specialization: "English Language",
    },
    {
      firstName: "Fatima",
      lastName: "Yusuf",
      email: "fatima.yusuf@stardreamworks.edu",
      password: "teacher123",
      phone: "+2348034567890",
      qualification: "B.Sc Integrated Science",
      specialization: "Science",
    },
  ];

  const teachers: Record<string, any> = {};
  for (let i = 0; i < teachersData.length; i++) {
    const t = teachersData[i];
    const hashedPassword = await bcrypt.hash(t.password, 10);
    const teacherId = `TCH${new Date().getFullYear()}${100 + i + 1}`;

    const user = await prisma.user.create({
      data: {
        email: t.email,
        password: hashedPassword,
        name: `${t.firstName} ${t.lastName}`,
        role: "TEACHER",
        phone: t.phone,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        teacherId,
        firstName: t.firstName,
        lastName: t.lastName,
        phone: t.phone,
        qualification: t.qualification,
        specialization: t.specialization,
      },
    });

    teachers[`${t.firstName}${i + 1}`] = teacher;
  }
  console.log(`✅ Created ${teachersData.length} teachers`);

  // ---------- CLASSES ----------
  const classesData = [
    { name: "Nursery 1", level: "NURSERY", section: "A" },
    { name: "Primary 3", level: "PRIMARY", section: "A" },
    { name: "JSS 2", level: "JSS", section: "B" },
  ];

  const createdClasses: Record<string, any> = {};
  const classTeacherAssignments = [
    { className: "Nursery 1", teacher: teachers[`Grace${1}`] },
    { className: "Primary 3", teacher: teachers[`Emeka${2}`] },
    { className: "JSS 2", teacher: teachers[`Fatima${3}`] },
  ];

  for (let i = 0; i < classesData.length; i++) {
    const c = classesData[i];
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        section: c.section,
        level: c.level,
        classTeacherId: classTeacherAssignments[i].teacher.id,
        academicSession: new Date().getFullYear().toString(),
        capacity: 40,
        description: `${c.name} ${c.section} class`,
      },
    });
    createdClasses[c.name] = cls;
  }
  console.log(`✅ Created ${classesData.length} classes`);

  // ---------- TEACHER-CLASS & TEACHER-SUBJECT ASSIGNMENTS ----------
  const teacherClassAssignments = [
    { teacher: teachers[`Grace${1}`], className: "Nursery 1" },
    { teacher: teachers[`Emeka${2}`], className: "Primary 3" },
    { teacher: teachers[`Fatima${3}`], className: "JSS 2" },
    { teacher: teachers[`Grace${1}`], className: "Primary 3" },
    { teacher: teachers[`Emeka${2}`], className: "JSS 2" },
  ];

  for (const a of teacherClassAssignments) {
    await prisma.teacherClass.create({
      data: {
        teacherId: a.teacher.id,
        classId: createdClasses[a.className].id,
      },
    });
  }

  const teacherSubjectAssignments = [
    { teacher: teachers[`Grace${1}`], subjectCode: "MATH" },
    { teacher: teachers[`Emeka${2}`], subjectCode: "ENG" },
    { teacher: teachers[`Fatima${3}`], subjectCode: "SCN" },
    { teacher: teachers[`Grace${1}`], subjectCode: "SST" },
    { teacher: teachers[`Emeka${2}`], subjectCode: "CRT" },
    { teacher: teachers[`Fatima${3}`], subjectCode: "PHE" },
  ];

  for (const a of teacherSubjectAssignments) {
    await prisma.teacherSubject.create({
      data: {
        teacherId: a.teacher.id,
        subjectId: subjects[a.subjectCode].id,
      },
    });
  }
  console.log("✅ Created teacher-class and teacher-subject assignments");

  // ---------- CLASS-SUBJECT ASSIGNMENTS ----------
  await prisma.classSubject.createMany({
    data: [
      { classId: createdClasses["Nursery 1"].id, subjectId: subjects["MATH"].id },
      { classId: createdClasses["Nursery 1"].id, subjectId: subjects["ENG"].id },
      { classId: createdClasses["Primary 3"].id, subjectId: subjects["MATH"].id },
      { classId: createdClasses["Primary 3"].id, subjectId: subjects["ENG"].id },
      { classId: createdClasses["Primary 3"].id, subjectId: subjects["SCN"].id },
      { classId: createdClasses["Primary 3"].id, subjectId: subjects["SST"].id },
      { classId: createdClasses["JSS 2"].id, subjectId: subjects["SCN"].id },
      { classId: createdClasses["JSS 2"].id, subjectId: subjects["SST"].id },
      { classId: createdClasses["JSS 2"].id, subjectId: subjects["CRT"].id },
      { classId: createdClasses["JSS 2"].id, subjectId: subjects["PHE"].id },
    ],
  });

  // ---------- STUDENTS ----------
  const studentsData = [
    {
      firstName: "Amara",
      lastName: "Nwosu",
      email: "amara.nwosu@stardreamworks.edu",
      password: "student123",
      gender: "FEMALE",
      className: "Nursery 1",
      parentContact: "+2348100000001",
      address: "12 Unity Road, Lagos",
    },
    {
      firstName: "Chinedu",
      lastName: "Okonkwo",
      email: "chinedu.okonkwo@stardreamworks.edu",
      password: "student123",
      gender: "MALE",
      className: "Nursery 1",
      parentContact: "+2348100000002",
      address: "45 Peace Avenue, Lagos",
    },
    {
      firstName: "Aisha",
      lastName: "Mohammed",
      email: "aisha.mohammed@stardreamworks.edu",
      password: "student123",
      gender: "FEMALE",
      className: "Primary 3",
      parentContact: "+2348100000003",
      address: "8 Crescent Street, Abuja",
    },
    {
      firstName: "Tunde",
      lastName: "Adeyemi",
      email: "tunde.adeyemi@stardreamworks.edu",
      password: "student123",
      gender: "MALE",
      className: "Primary 3",
      parentContact: "+2348100000004",
      address: "23 Market Road, Ibadan",
    },
    {
      firstName: "Zainab",
      lastName: "Ibrahim",
      email: "zainab.ibrahim@stardreamworks.edu",
      password: "student123",
      gender: "FEMALE",
      className: "JSS 2",
      parentContact: "+2348100000005",
      address: "17 School Lane, Kano",
    },
  ];

  const students: Record<string, any> = {};
  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    const hashedPassword = await bcrypt.hash(s.password, 10);
    const studentId = `SDS${new Date().getFullYear()}${1000 + i + 1}`;
    const cls = createdClasses[s.className];

    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: hashedPassword,
        name: `${s.firstName} ${s.lastName}`,
        role: "STUDENT",
        phone: s.parentContact,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        dateOfBirth: new Date(2016 + i, i % 12, (i % 27) + 1),
        gender: s.gender,
        classId: cls.id,
        parentContact: s.parentContact,
        address: s.address,
        academicSession: new Date().getFullYear().toString(),
        status: "ACTIVE",
      },
    });

    students[`${s.firstName}${i + 1}`] = student;
  }
  console.log(`✅ Created ${studentsData.length} students`);

  // ---------- PARENTS ----------
  const parentsData = [
    {
      firstName: "Ngozi",
      lastName: "Nwosu",
      email: "ngozi.nwosu@stardreamworks.edu",
      password: "parent123",
      phone: "+2348101111111",
      address: "12 Unity Road, Lagos",
      occupation: "Business Woman",
      child: "Amara1",
    },
    {
      firstName: "Musa",
      lastName: "Ibrahim",
      email: "musa.ibrahim@stardreamworks.edu",
      password: "parent123",
      phone: "+2348102222222",
      address: "17 School Lane, Kano",
      occupation: "Engineer",
      child: "Zainab5",
    },
  ];

  const parents: Record<string, any> = {};
  for (let i = 0; i < parentsData.length; i++) {
    const p = parentsData[i];
    const hashedPassword = await bcrypt.hash(p.password, 10);

    const user = await prisma.user.create({
      data: {
        email: p.email,
        password: hashedPassword,
        name: `${p.firstName} ${p.lastName}`,
        role: "PARENT",
        phone: p.phone,
      },
    });

    const parent = await prisma.parent.create({
      data: {
        userId: user.id,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        address: p.address,
        occupation: p.occupation,
      },
    });

    parents[`${p.firstName}${i + 1}`] = parent;
  }
  console.log(`✅ Created ${parentsData.length} parents`);

  // Link parents to students
  await prisma.parentStudent.create({
    data: {
      parentId: parents["Ngozi1"].id,
      studentId: students["Amara1"].id,
    },
  });
  await prisma.parentStudent.create({
    data: {
      parentId: parents["Musa2"].id,
      studentId: students["Zainab5"].id,
    },
  });
  await prisma.parentStudent.create({
    data: {
      parentId: parents["Ngozi1"].id,
      studentId: students["Chinedu2"].id,
    },
  });
  await prisma.parentStudent.create({
    data: {
      parentId: parents["Musa2"].id,
      studentId: students["Aisha3"].id,
    },
  });
  console.log("✅ Linked parents to students");

  // ---------- ANNOUNCEMENTS ----------
  await prisma.announcement.createMany({
    data: [
      {
        title: "Welcome to the New Academic Session",
        content:
          "We are excited to welcome all students, parents and staff to a new academic session. Wishing everyone a productive and successful year ahead.",
        authorId: admin.id,
        targetType: "SCHOOL",
        priority: "IMPORTANT",
        isPublished: true,
      },
      {
        title: "Inter-House Sports Competition",
        content:
          "Please be informed that the annual inter-house sports competition will be held next month. All students are expected to participate.",
        authorId: admin.id,
        targetType: "SCHOOL",
        priority: "NORMAL",
        isPublished: true,
      },
      {
        title: "Parent-Teacher Conference",
        content:
          "A parent-teacher conference is scheduled for the end of this term. Details regarding time and venue will be communicated soon.",
        authorId: admin.id,
        targetType: "SCHOOL",
        priority: "URGENT",
        isPublished: true,
      },
      {
        title: "Mid-Term Test Schedule",
        content:
          "Mid-term tests begin next week. Students should prepare adequately and revise all topics covered so far.",
        authorId: teachers["Grace1"].userId,
        targetType: "CLASS",
        classId: createdClasses["Primary 3"].id,
        priority: "IMPORTANT",
        isPublished: true,
      },
    ],
  });
  console.log("✅ Created sample announcements");

  // ---------- NEWS ----------
  await prisma.news.createMany({
    data: [
      {
        title: "STAR DreamWorks Wins Regional Quiz Championship",
        content:
          "Our students excelled at the regional inter-school quiz championship, bringing home the first-place trophy. We are incredibly proud of their hard work and dedication.",
        excerpt: "Our students won the regional quiz championship.",
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        title: "New Science Laboratory Commissioned",
        content:
          "STAR DreamWorks Schools has commissioned a state-of-the-art science laboratory to enhance practical learning for our secondary students.",
        excerpt: "A new science laboratory is now operational.",
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        title: "Enrollment Open for Next Session",
        content:
          "Admissions are now open for the upcoming academic session across all our campuses. Limited spaces are available in each class. Contact our admissions office for more details.",
        excerpt: "Admissions open for next session.",
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date(),
      },
    ],
  });
  console.log("✅ Created sample news articles");

  // ---------- EVENTS ----------
  const now = new Date();
  await prisma.event.createMany({
    data: [
      {
        title: "Cultural Day Celebration",
        description:
          "An exciting day of cultural displays, traditional performances and food from diverse cultures.",
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 9, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 16, 0),
        location: "Main School Auditorium",
        isPublished: true,
      },
      {
        title: "Inter-House Sports Competition",
        description:
          "The annual athletics competition featuring races, relays and field events across all houses.",
        startDate: new Date(now.getFullYear(), now.getMonth() + 2, 5, 8, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 5, 17, 0),
        location: "School Sports Field",
        isPublished: true,
      },
      {
        title: "Graduation Ceremony",
        description:
          "Award ceremony for graduating students of the current academic session.",
        startDate: new Date(now.getFullYear() + 1, 6, 20, 10, 0),
        endDate: new Date(now.getFullYear() + 1, 6, 20, 14, 0),
        location: "Main School Auditorium",
        isPublished: false,
      },
    ],
  });
  console.log("✅ Created sample events");

  // ---------- ASSIGNMENTS ----------
  const assignmentCreateData = [
    {
      title: "Addition and Subtraction Practice",
      description: "Practice exercises on addition and subtraction of numbers up to 100.",
      subjectCode: "MATH",
      className: "Nursery 1",
      teacher: teachers["Grace1"],
      dueDays: 7,
    },
    {
      title: "Reading Comprehension - The Village Market",
      description: "Read the passage and answer the comprehension questions.",
      subjectCode: "ENG",
      className: "Primary 3",
      teacher: teachers["Emeka2"],
      dueDays: 5,
    },
    {
      title: "States of Matter Experiment",
      description: "Conduct a simple experiment on the three states of matter and write a report.",
      subjectCode: "SCN",
      className: "JSS 2",
      teacher: teachers["Fatima3"],
      dueDays: 10,
    },
  ];

  const assignments: any[] = [];
  for (const a of assignmentCreateData) {
    const assignment = await prisma.assignment.create({
      data: {
        title: a.title,
        description: a.description,
        subjectId: subjects[a.subjectCode].id,
        classId: createdClasses[a.className].id,
        teacherId: a.teacher.id,
        dueDate: new Date(now.getTime() + a.dueDays * 24 * 60 * 60 * 1000),
        maxScore: 100,
      },
    });
    assignments.push(assignment);
  }
  console.log("✅ Created sample assignments");

  // ---------- SUBMISSIONS ----------
  const submissionData = [
    {
      assignmentIndex: 0,
      student: students["Amara1"],
      content: "I have completed all the addition and subtraction practice exercises.",
    },
    {
      assignmentIndex: 0,
      student: students["Chinedu2"],
      content: "Finished the practice set. Found subtraction a bit tricky but managed.",
    },
    {
      assignmentIndex: 1,
      student: students["Aisha3"],
      content: "Submitted my answers to the comprehension questions.",
      status: "SUBMITTED",
    },
    {
      assignmentIndex: 1,
      student: students["Tunde4"],
      content: "Completed the reading task.",
      status: "SUBMITTED",
    },
    {
      assignmentIndex: 2,
      student: students["Zainab5"],
      content: "Conducted the experiment and wrote a detailed report.",
      status: "SUBMITTED",
    },
  ];

  for (const s of submissionData) {
    const assignment = assignments[s.assignmentIndex];
    await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: s.student.id,
        content: s.content,
        status: s.status || "SUBMITTED",
        submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log("✅ Created sample submissions");

  // ---------- GRADES ----------
  const gradeData = [
    { student: "Amara1", subjectCode: "MATH", className: "Nursery 1", teacher: "Grace1", score: 85, term: "FIRST" },
    { student: "Amara1", subjectCode: "ENG", className: "Nursery 1", teacher: "Emeka2", score: 78, term: "FIRST" },
    { student: "Chinedu2", subjectCode: "MATH", className: "Nursery 1", teacher: "Grace1", score: 72, term: "FIRST" },
    { student: "Chinedu2", subjectCode: "ENG", className: "Nursery 1", teacher: "Emeka2", score: 65, term: "FIRST" },
    { student: "Aisha3", subjectCode: "MATH", className: "Primary 3", teacher: "Grace1", score: 90, term: "FIRST" },
    { student: "Aisha3", subjectCode: "SCN", className: "Primary 3", teacher: "Fatima3", score: 88, term: "FIRST" },
    { student: "Tunde4", subjectCode: "ENG", className: "Primary 3", teacher: "Emeka2", score: 81, term: "FIRST" },
    { student: "Zainab5", subjectCode: "SCN", className: "JSS 2", teacher: "Fatima3", score: 93, term: "FIRST" },
    { student: "Zainab5", subjectCode: "PHE", className: "JSS 2", teacher: "Fatima3", score: 87, term: "FIRST" },
  ];

  for (const g of gradeData) {
    const cls = createdClasses[g.className];
    await prisma.grade.create({
      data: {
        studentId: students[g.student].id,
        subjectId: subjects[g.subjectCode].id,
        classId: cls.id,
        academicSession: now.getFullYear().toString(),
        term: g.term,
        score: g.score,
        grade: g.score >= 80 ? "A" : g.score >= 70 ? "B" : g.score >= 60 ? "C" : "D",
        remarks: g.score >= 80 ? "Excellent performance" : "Good performance, keep improving",
        teacherId: teachers[g.teacher].id,
      },
    });
  }
  console.log("✅ Created sample grades");

  // ---------- GALLERY ----------
  await prisma.galleryItem.createMany({
    data: [
      {
        title: "Science Fair 2025",
        description: "Students presenting their projects at the annual science fair.",
        imageUrl: "/images/gallery/science-fair.jpg",
        category: "ACADEMIC",
        isPublished: true,
      },
      {
        title: "Cultural Day",
        description: "Students in colourful traditional attire during cultural day.",
        imageUrl: "/images/gallery/cultural-day.jpg",
        category: "EVENT",
        isPublished: true,
      },
      {
        title: "Sports Day Parade",
        description: "The colorful opening parade at the inter-house sports competition.",
        imageUrl: "/images/gallery/sports-day.jpg",
        category: "SPORTS",
        isPublished: true,
      },
      {
        title: "Classroom Activity",
        description: "A glimpse of our students engaged in an interactive classroom session.",
        imageUrl: "/images/gallery/classroom.jpg",
        category: "ACADEMIC",
        isPublished: true,
      },
    ],
  });
  console.log("✅ Created sample gallery items");

  console.log("\n🎉 Seed completed successfully!");
  console.log("------------------------------");
  console.log("Admin:  admin@stardreamworks.edu / admin123");
  console.log("Teacher: grace.okafor@stardreamworks.edu / teacher123");
  console.log("Student: amara.nwosu@stardreamworks.edu / student123");
  console.log("Parent:  ngozi.nwosu@stardreamworks.edu / parent123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
