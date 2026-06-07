import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import Performance from '../models/Performance.js';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import { ROLES } from '../config/roles.js';

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Human Resources', 'Operations'];
const FIRST = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Kabir', 'Isha', 'Reyansh', 'Myra', 'Arjun', 'Sara', 'Vihaan', 'Aisha'];
const LAST = ['Sharma', 'Patel', 'Reddy', 'Khan', 'Nair', 'Gupta', 'Mehta', 'Iyer', 'Bose', 'Das'];

const pick = (arr, i) => arr[i % arr.length];
const dateStr = (d) => d.toISOString().slice(0, 10);

async function seed() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_hrms');

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Payroll.deleteMany({}),
    Performance.deleteMany({}),
    Job.deleteMany({}),
    Candidate.deleteMany({}),
  ]);

  // --- Core demo accounts (one per role) ---
  const demo = [
    { name: 'Admin User', email: 'admin@hrms.com', role: ROLES.ADMIN, department: 'Human Resources', designation: 'Management Admin', salary: 18000 },
    { name: 'Sneha Senior', email: 'manager@hrms.com', role: ROLES.SENIOR_MANAGER, department: 'Engineering', designation: 'Senior Manager', salary: 12000 },
    { name: 'Raj Recruiter', email: 'recruiter@hrms.com', role: ROLES.HR_RECRUITER, department: 'Human Resources', designation: 'HR Recruiter', salary: 7000 },
    { name: 'Emma Employee', email: 'employee@hrms.com', role: ROLES.EMPLOYEE, department: 'Engineering', designation: 'Software Engineer', salary: 6000 },
  ];

  const created = [];
  let idx = 1;
  for (const d of demo) {
    const u = await User.create({ ...d, password: 'password123', employeeId: `EMP${String(idx++).padStart(4, '0')}` });
    created.push(u);
  }
  const [admin, manager] = created;

  // --- Bulk employees to demonstrate scale ---
  console.log('👥 Creating sample employees...');
  const bulk = [];
  for (let i = 0; i < 40; i++) {
    const name = `${pick(FIRST, i)} ${pick(LAST, i)}`;
    bulk.push({
      name,
      email: `employee${i + 1}@hrms.com`,
      password: 'password123',
      role: ROLES.EMPLOYEE,
      department: pick(DEPARTMENTS, i),
      designation: 'Associate',
      salary: 4000 + (i % 6) * 800,
      manager: manager._id,
      employeeId: `EMP${String(idx++).padStart(4, '0')}`,
      status: i % 11 === 0 ? 'on_leave' : 'active',
    });
  }
  // create() runs the password-hash hook per doc
  const employees = await User.create(bulk);
  const allEmployees = [...created, ...employees];

  // --- Attendance for today + last few days ---
  console.log('🕒 Seeding attendance...');
  const attendance = [];
  for (let day = 0; day < 5; day++) {
    const d = new Date();
    d.setDate(d.getDate() - day);
    const date = dateStr(d);
    for (const emp of allEmployees) {
      if (Math.random() < 0.12 && day === 0) continue; // some not yet checked in today
      const checkIn = new Date(d);
      checkIn.setHours(9, Math.floor(Math.random() * 30));
      const checkOut = new Date(d);
      checkOut.setHours(17 + (Math.random() < 0.3 ? 1 : 0), Math.floor(Math.random() * 50));
      attendance.push({
        employee: emp._id,
        date,
        checkIn,
        checkOut: day === 0 ? undefined : checkOut,
        status: emp.status === 'on_leave' ? 'leave' : Math.random() < 0.1 ? 'remote' : 'present',
        workedHours: day === 0 ? 0 : Math.round(((checkOut - checkIn) / 3.6e6) * 100) / 100,
      });
    }
  }
  await Attendance.insertMany(attendance, { ordered: false }).catch(() => {});

  // --- Leave requests ---
  console.log('📝 Seeding leave requests...');
  await LeaveRequest.create([
    { employee: allEmployees[5]._id, type: 'sick', startDate: new Date(), endDate: new Date(Date.now() + 2 * 864e5), days: 3, reason: 'Fever', status: 'pending' },
    { employee: allEmployees[8]._id, type: 'casual', startDate: new Date(Date.now() + 5 * 864e5), endDate: new Date(Date.now() + 6 * 864e5), days: 2, reason: 'Personal', status: 'pending' },
    { employee: allEmployees[3]._id, type: 'earned', startDate: new Date(Date.now() - 10 * 864e5), endDate: new Date(Date.now() - 8 * 864e5), days: 3, reason: 'Vacation', status: 'approved', reviewedBy: admin._id },
  ]);

  // --- Payroll for current month ---
  console.log('💰 Seeding payroll...');
  const now = new Date();
  const payroll = allEmployees.map((emp) => {
    const basic = emp.salary || 0;
    const allowances = Math.round(basic * 0.2);
    const tax = Math.round((basic + allowances) * 0.1);
    return {
      employee: emp._id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      basic,
      allowances,
      deductions: 0,
      tax,
      netPay: basic + allowances - tax,
      status: 'processed',
      processedBy: admin._id,
    };
  });
  await Payroll.insertMany(payroll, { ordered: false }).catch(() => {});

  // --- Performance reviews ---
  console.log('📈 Seeding performance reviews...');
  const perf = allEmployees.slice(0, 20).map((emp, i) => ({
    employee: emp._id,
    reviewer: manager._id,
    period: '2026-Q1',
    rating: 3 + (i % 3),
    kpis: { productivity: 60 + (i % 4) * 10, quality: 65 + (i % 3) * 10, teamwork: 70 + (i % 3) * 8 },
    goals: [
      { title: 'Ship feature X', progress: 80, status: 'in_progress' },
      { title: 'Mentor a junior', progress: 100, status: 'completed' },
    ],
    feedback: 'Solid contributor with room to grow in cross-team communication.',
    status: 'published',
  }));
  await Performance.insertMany(perf, { ordered: false }).catch(() => {});

  // --- Jobs ---
  console.log('💼 Seeding jobs...');
  const jobs = await Job.create([
    {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      location: 'Remote',
      description: 'Build scalable Node.js services and APIs for our HRMS platform.',
      requiredSkills: ['node.js', 'mongodb', 'express', 'rest api', 'docker'],
      minExperience: 4,
      salaryRange: { min: 8000, max: 12000 },
      postedBy: admin._id,
    },
    {
      title: 'Frontend Engineer (React)',
      department: 'Engineering',
      location: 'Bangalore',
      description: 'Craft delightful, responsive UIs in React and Tailwind.',
      requiredSkills: ['react', 'javascript', 'tailwind', 'redux', 'rest api'],
      minExperience: 2,
      salaryRange: { min: 6000, max: 9000 },
      postedBy: admin._id,
    },
  ]);

  // --- Candidates (pre-screened) ---
  console.log('🧑‍💼 Seeding candidates...');
  await Candidate.create([
    {
      name: 'Priya Resume',
      email: 'priya@example.com',
      job: jobs[0]._id,
      yearsExperience: 5,
      resumeText:
        'Experienced backend engineer skilled in Node.js, Express, MongoDB and REST API design. Built Docker-based microservices handling millions of requests.',
      stage: 'shortlisted',
      screening: {
        score: 88,
        recommendation: 'strong_yes',
        matchedSkills: ['node.js', 'mongodb', 'express', 'rest api', 'docker'],
        missingSkills: [],
        strengths: ['Strong Node.js & microservices background', '5 years relevant experience'],
        concerns: [],
        summary: 'Excellent fit for the Senior Backend Engineer role with full skill coverage.',
        model: 'seed',
        screenedAt: new Date(),
      },
    },
    {
      name: 'Sam Junior',
      email: 'sam@example.com',
      job: jobs[1]._id,
      yearsExperience: 1,
      resumeText: 'Frontend developer familiar with React and JavaScript. Built a few personal projects with Tailwind.',
      stage: 'ai_screened',
      screening: {
        score: 58,
        recommendation: 'maybe',
        matchedSkills: ['react', 'javascript', 'tailwind'],
        missingSkills: ['redux', 'rest api'],
        strengths: ['Good React fundamentals'],
        concerns: ['Below minimum experience', 'No Redux/REST exposure'],
        summary: 'Promising junior but light on experience and state-management skills.',
        model: 'seed',
        screenedAt: new Date(),
      },
    },
  ]);

  console.log('\n✅ Seed complete! Demo logins (password: password123):');
  demo.forEach((d) => console.log(`   ${d.role.padEnd(16)} ${d.email}`));
  console.log(`\n   + ${employees.length} additional employees (employee1..N@hrms.com)`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
