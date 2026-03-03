/**
 * Seed script — populate the DB with realistic sample data.
 * Run:  node --env-file=.env --import=tsx scripts/seed.ts
 */
import { db } from "../server/db";
import {
    users, tutorProfiles, tuteeProfiles, tutorSubjects, tutorAvailability,
    sessionsTable, reviews, conversations, messages, gigs,
} from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ─── helpers ────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
const SALT = 10;

// ─── raw data ────────────────────────────────────────────────────────────────
const TEACHERS = [
    {
        first: "Arjun", last: "Sharma", email: "arjun@example.com", uni: "IIT Delhi", major: "Computer Science", yr: 3,
        bio: "Passionate CS undergrad who loves breaking down complex algorithms into simple steps. 200+ hours tutoring experience.",
        subjects: [
            { subject: "Data Structures", proficiency: "expert", rate: 80000 },
            { subject: "Algorithms", proficiency: "expert", rate: 90000 },
            { subject: "Python", proficiency: "intermediate", rate: 60000 },
        ],
        avail: [[1, "09:00", "11:00"], [3, "14:00", "17:00"], [5, "10:00", "13:00"]],
    },
    {
        first: "Priya", last: "Patel", email: "priya@example.com", uni: "BITS Pilani", major: "Mathematics", yr: 4,
        bio: "Maths nerd, ex-olympiad gold medalist. I make calculus and linear algebra feel intuitive through real-world examples.",
        subjects: [
            { subject: "Calculus", proficiency: "expert", rate: 70000 },
            { subject: "Linear Algebra", proficiency: "expert", rate: 75000 },
            { subject: "Statistics", proficiency: "intermediate", rate: 55000 },
        ],
        avail: [[2, "11:00", "13:00"], [4, "16:00", "18:00"], [6, "09:00", "12:00"]],
    },
    {
        first: "Rohan", last: "Mehta", email: "rohan@example.com", uni: "NIT Trichy", major: "Electronics", yr: 3,
        bio: "Electronics & embedded systems enthusiast. Helped 50+ students with circuit design and microcontrollers.",
        subjects: [
            { subject: "Circuit Design", proficiency: "expert", rate: 65000 },
            { subject: "Microcontrollers", proficiency: "expert", rate: 70000 },
            { subject: "Digital Logic", proficiency: "intermediate", rate: 50000 },
        ],
        avail: [[1, "14:00", "16:00"], [3, "09:00", "11:00"], [5, "15:00", "18:00"]],
    },
    {
        first: "Sneha", last: "Gupta", email: "sneha@example.com", uni: "Delhi University", major: "English Literature", yr: 2,
        bio: "English lit student with a flair for writing. Essay coaching, grammar, and creative writing are my specialties.",
        subjects: [
            { subject: "Essay Writing", proficiency: "expert", rate: 45000 },
            { subject: "Grammar", proficiency: "expert", rate: 40000 },
            { subject: "Literature", proficiency: "intermediate", rate: 50000 },
        ],
        avail: [[2, "10:00", "12:00"], [4, "14:00", "16:00"], [0, "11:00", "13:00"]],
    },
    {
        first: "Kiran", last: "Reddy", email: "kiran@example.com", uni: "IISc Bangalore", major: "Physics", yr: 4,
        bio: "Physics PhD aspirant. Love teaching quantum mechanics and making it feel less scary with visualizations.",
        subjects: [
            { subject: "Quantum Mechanics", proficiency: "expert", rate: 100000 },
            { subject: "Thermodynamics", proficiency: "expert", rate: 85000 },
            { subject: "Classical Mechanics", proficiency: "expert", rate: 80000 },
        ],
        avail: [[1, "16:00", "18:00"], [3, "11:00", "13:00"], [5, "09:00", "11:00"]],
    },
    {
        first: "Aisha", last: "Khan", email: "aisha@example.com", uni: "Jadavpur University", major: "Design", yr: 3,
        bio: "UI/UX & graphic design student. Figma, Canva, Adobe — I teach the tools and the principles behind them.",
        subjects: [
            { subject: "UI/UX Design", proficiency: "expert", rate: 75000 },
            { subject: "Figma", proficiency: "expert", rate: 60000 },
            { subject: "Graphic Design", proficiency: "intermediate", rate: 55000 },
        ],
        avail: [[2, "13:00", "15:00"], [4, "09:00", "11:00"], [6, "14:00", "17:00"]],
    },
    {
        first: "Dev", last: "Nair", email: "dev@example.com", uni: "VIT Vellore", major: "Information Technology", yr: 2,
        bio: "Frontend developer & React enthusiast. Built 20+ web apps. Teaching web dev from basics to deployed projects.",
        subjects: [
            { subject: "React", proficiency: "expert", rate: 90000 },
            { subject: "JavaScript", proficiency: "expert", rate: 80000 },
            { subject: "HTML & CSS", proficiency: "intermediate", rate: 40000 },
        ],
        avail: [[1, "10:00", "12:00"], [3, "16:00", "18:00"], [5, "13:00", "15:00"]],
    },
    {
        first: "Tanvi", last: "Joshi", email: "tanvi@example.com", uni: "Pune University", major: "Biology", yr: 3,
        bio: "Biology & biochemistry tutor. Pre-med companion — NEET prep, cell biology, genetics are my strong suits.",
        subjects: [
            { subject: "Biology", proficiency: "expert", rate: 60000 },
            { subject: "Biochemistry", proficiency: "expert", rate: 65000 },
            { subject: "NEET Preparation", proficiency: "expert", rate: 85000 },
        ],
        avail: [[2, "09:00", "11:00"], [4, "13:00", "15:00"], [6, "10:00", "12:00"]],
    },
];

const STUDENTS = [
    { first: "Amit", last: "Singh", email: "amit@example.com", uni: "IIT Bombay", major: "Mechanical Eng", yr: 1 },
    { first: "Pooja", last: "Verma", email: "pooja@example.com", uni: "BITS Pilani", major: "Physics", yr: 2 },
    { first: "Rahul", last: "Das", email: "rahul@example.com", uni: "IIT Delhi", major: "Civil Eng", yr: 2 },
    { first: "Meera", last: "Iyer", email: "meera@example.com", uni: "NIT Trichy", major: "CS", yr: 1 },
];

const REVIEW_TEXTS: { [rating: number]: string[] } = {
    5: [
        "Absolutely brilliant tutor! Explained everything with such clarity. Highly recommend!",
        "Made a really tough topic feel easy. Went above and beyond every session.",
        "Best tutor I've found on the platform. Patient, knowledgeable, and very thorough.",
        "5 stars isn't enough. My exam score jumped from 60% to 92% after just 4 sessions!",
    ],
    4: [
        "Very good teacher, explains well and is always prepared. Would book again.",
        "Really helpful sessions. Occasionally goes a bit fast but happy to slow down on request.",
        "Good grasp of the subject, good examples. Minor scheduling hiccups but overall great.",
    ],
    3: [
        "Decent sessions, covered the topics needed but could use more examples.",
        "Okay experience. The teacher knows the material but communication could be better.",
    ],
};

const REVIEW_TAGS = ["Clear Explanations", "Patient", "Expert", "Prepared", "Flexible", "Responsive", "Great Examples", "Motivating"];

const GIG_SAMPLES = [
    // LEARN gigs (students looking for teachers)
    { title: "Need React tutor for 4-week crash course", desc: "[LEARN] I'm a beginner in web dev and want to build a full React project from scratch. Looking for someone who can do 2 sessions/week.", cat: "tech", budget: 300000, skills: ["React", "JavaScript", "HTML"], posterIdx: 0 },
    { title: "Help understanding Thermodynamics (GATE prep)", desc: "[LEARN] Final year student preparing for GATE 2025. Need help with Thermo theory and numericals specifically. Flexible timing.", cat: "academic", budget: 200000, skills: ["Physics", "Thermodynamics"], posterIdx: 1 },
    { title: "Calculus urgent — exam in 10 days!", desc: "[LEARN] Really struggling with integration techniques and series convergence. Need 5-6 urgent sessions this week before my semester exam.", cat: "academic", budget: 150000, skills: ["Calculus", "Mathematics"], posterIdx: 2 },
    { title: "Looking for a Figma / UI design mentor", desc: "[LEARN] I want to transition into product design. Need someone to review my portfolio and teach me best practices in Figma.", cat: "creative", budget: 250000, skills: ["Figma", "UI/UX Design"], posterIdx: 3 },
    { title: "Python scripting basics — complete beginner", desc: "[LEARN] No coding background at all. Want to learn Python to automate my college work. Need a very patient teacher!", cat: "tech", budget: 180000, skills: ["Python"], posterIdx: 0 },
    { title: "NEET Biology — Cell Division to Genetics", desc: "[LEARN] Weak in genetics and molecular biology. Need an expert who can explain with diagrams and practice MCQs. 3 sessions needed.", cat: "academic", budget: 220000, skills: ["Biology", "NEET Preparation"], posterIdx: 1 },
    // TEACH gigs (teachers offering their skills)
    { title: "Offering Data Structures & Algorithms sessions", desc: "[TEACH] Expert in DSA with 2 years tutoring experience. Offering weekend batches for interview prep or academics. Limited seats.", cat: "tech", budget: 120000, skills: ["Data Structures", "Algorithms"], posterIdx: 2 },
    { title: "Grammar & Essay Writing coach — all levels", desc: "[TEACH] English Lit student offering 1-on-1 coaching for essays, letters, and grammar. School, college, or competitive exams.", cat: "academic", budget: 80000, skills: ["Essay Writing", "Grammar"], posterIdx: 3 },
    { title: "Graphic design sessions — Canva & Photoshop", desc: "[TEACH] Design student offering beginner to intermediate graphic design lessons. Poster, PPT, social media design covered.", cat: "creative", budget: 90000, skills: ["Graphic Design", "Canva", "Figma"], posterIdx: 0 },
];

// ─── main ────────────────────────────────────────────────────────────────────
async function seed() {
    console.log("🌱  Starting seed…");

    const hash = await bcrypt.hash("password123", SALT);

    // 1. Upsert teacher users
    console.log("👩‍🏫  Inserting teachers…");
    const teacherIds: string[] = [];
    for (const t of TEACHERS) {
        const [u] = await db
            .insert(users)
            .values({ email: t.email, firstName: t.first, lastName: t.last, passwordHash: hash })
            .onConflictDoUpdate({ target: users.email, set: { firstName: t.first, lastName: t.last } })
            .returning({ id: users.id });
        teacherIds.push(u.id);

        // tutor profile
        await db
            .insert(tutorProfiles)
            .values({ userId: u.id, university: t.uni, major: t.major, yearOfStudy: t.yr, bio: t.bio, isActive: true })
            .onConflictDoUpdate({ target: tutorProfiles.userId, set: { bio: t.bio, university: t.uni } });

        // subjects (delete old first to avoid unique constraint trouble)
        await db.delete(tutorSubjects).where(eq(tutorSubjects.tutorId, u.id));
        for (const s of t.subjects) {
            await db.insert(tutorSubjects).values({ tutorId: u.id, subject: s.subject, proficiency: s.proficiency, hourlyRateCents: s.rate }).onConflictDoNothing();
        }

        // availability
        await db.delete(tutorAvailability).where(eq(tutorAvailability.tutorId, u.id));
        for (const [day, start, end] of t.avail) {
            await db.insert(tutorAvailability).values({ tutorId: u.id, dayOfWeek: day as number, startTime: start as string, endTime: end as string });
        }
    }

    // 2. Upsert student users
    console.log("📚  Inserting students…");
    const studentIds: string[] = [];
    for (const s of STUDENTS) {
        const [u] = await db
            .insert(users)
            .values({ email: s.email, firstName: s.first, lastName: s.last, passwordHash: hash })
            .onConflictDoUpdate({ target: users.email, set: { firstName: s.first, lastName: s.last } })
            .returning({ id: users.id });
        studentIds.push(u.id);

        // tutee profile
        await db
            .insert(tuteeProfiles)
            .values({ userId: u.id, university: s.uni, major: s.major, yearOfStudy: s.yr })
            .onConflictDoUpdate({ target: tuteeProfiles.userId, set: { university: s.uni } });
    }

    // 3. Sessions + reviews
    console.log("📅  Inserting sessions & reviews…");
    const ratingPairs: [number, number, number, string][] = [
        // [teacherIdx, studentIdx, rating, subjectName]
        [0, 0, 5, "Data Structures"],
        [0, 1, 5, "Algorithms"],
        [0, 2, 4, "Python"],
        [1, 0, 5, "Calculus"],
        [1, 1, 4, "Statistics"],
        [1, 3, 5, "Linear Algebra"],
        [2, 2, 4, "Circuit Design"],
        [3, 3, 5, "Essay Writing"],
        [4, 0, 5, "Quantum Mechanics"],
        [4, 1, 4, "Thermodynamics"],
        [5, 2, 5, "UI/UX Design"],
        [5, 3, 4, "Figma"],
        [6, 0, 5, "React"],
        [6, 1, 4, "JavaScript"],
        [7, 2, 5, "Biology"],
        [7, 3, 3, "NEET Preparation"],
    ];

    for (const [tIdx, sIdx, rating, subject] of ratingPairs) {
        const tutorId = teacherIds[tIdx];
        const tuteeId = studentIds[sIdx];
        const scheduledAt = new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000);
        const hourlyRate = 60000 + Math.floor(Math.random() * 40000);
        const duration = 60;
        const total = Math.round(hourlyRate * duration / 60);
        const fee = Math.round(total * 0.1);

        const [sess] = await db.insert(sessionsTable).values({
            tutorId, tuteeId, subject,
            status: "completed",
            scheduledAt,
            durationMinutes: duration,
            hourlyRateCents: hourlyRate,
            totalAmountCents: total,
            platformFeeCents: fee,
            tutorEarningsCents: total - fee,
            paymentStatus: "paid",
        }).returning({ id: sessionsTable.id });

        const texts = REVIEW_TEXTS[rating] ?? REVIEW_TEXTS[4];
        await db.insert(reviews).values({
            sessionId: sess.id,
            reviewerId: tuteeId,
            revieweeId: tutorId,
            rating,
            review: pick(texts),
            tags: [pick(REVIEW_TAGS), pick(REVIEW_TAGS)].filter((v, i, a) => a.indexOf(v) === i),
        }).onConflictDoNothing();
    }

    // 4. Conversations + messages
    console.log("💬  Inserting conversations…");
    const convPairs = [
        {
            t: 0, s: 0, msgs: [
                { from: "s", text: "Hi Arjun! I saw your DSA profile. Can we discuss a session plan?" },
                { from: "t", text: "Hey Amit! Sure. Are you targeting interviews or academics?" },
                { from: "s", text: "Primarily placements — LeetCode medium problems." },
                { from: "t", text: "Perfect. I'd suggest starting with arrays, then trees. Want to book a trial session?" },
                { from: "s", text: "Yes! What's your availability this week?" },
            ]
        },
        {
            t: 1, s: 1, msgs: [
                { from: "s", text: "Priya, I've been struggling with integration by parts. Can you help?" },
                { from: "t", text: "Absolutely! It's easier once you see the pattern. Monday 11am works?" },
                { from: "s", text: "That's perfect. See you then!" },
            ]
        },
        {
            t: 6, s: 2, msgs: [
                { from: "s", text: "Hey Dev, I want to build a portfolio site using React. Can you guide me?" },
                { from: "t", text: "100%! We'll start with component architecture and state. Should take 3-4 sessions." },
                { from: "s", text: "Awesome. Can we start this weekend?" },
                { from: "t", text: "Saturday 10am works for me. I'll share a starter GitHub repo before the session." },
            ]
        },
    ];

    for (const pair of convPairs) {
        const p1 = teacherIds[pair.t];
        const p2 = studentIds[pair.s];
        const lastMsg = pair.msgs[pair.msgs.length - 1];

        const [conv] = await db.insert(conversations).values({
            participant1Id: p1,
            participant2Id: p2,
            lastMessageContent: lastMsg.text,
            lastMessageSenderId: lastMsg.from === "t" ? p1 : p2,
            lastMessageAt: new Date(),
        }).onConflictDoUpdate({
            target: [conversations.participant1Id, conversations.participant2Id],
            set: { lastMessageContent: lastMsg.text, lastMessageAt: new Date() },
        }).returning({ id: conversations.id });

        // Insert messages
        for (let i = 0; i < pair.msgs.length; i++) {
            const m = pair.msgs[i];
            await db.insert(messages).values({
                conversationId: conv.id,
                senderId: m.from === "t" ? p1 : p2,
                content: m.text,
                type: "text",
                read: i < pair.msgs.length - 1,
                createdAt: new Date(Date.now() - (pair.msgs.length - i) * 2 * 60 * 1000),
            });
        }
    }

    // 5. Gigs
    console.log("📋  Inserting gigs…");
    await db.delete(gigs); // clear existing; re-insert fresh
    for (const g of GIG_SAMPLES) {
        const posterId = g.posterIdx < studentIds.length ? studentIds[g.posterIdx] : teacherIds[g.posterIdx - studentIds.length];
        const poster = g.posterIdx < studentIds.length ? studentIds[g.posterIdx] : teacherIds[0];
        await db.insert(gigs).values({
            posterId: poster,
            title: g.title,
            description: g.desc,
            category: g.cat,
            budgetCents: g.budget,
            skillsRequired: g.skills,
            deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000),
            status: "open",
        });
    }

    console.log("\n✅  Seed complete!");
    console.log(`   Teachers: ${teacherIds.length}`);
    console.log(`   Students: ${studentIds.length}`);
    console.log(`   Sessions: ${ratingPairs.length}`);
    console.log(`   Reviews:  ${ratingPairs.length}`);
    console.log(`   Gigs:     ${GIG_SAMPLES.length}`);
    console.log("\n🔑  All accounts use password: password123");
    console.log("   e.g. arjun@example.com / password123");
    process.exit(0);
}

seed().catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); });
