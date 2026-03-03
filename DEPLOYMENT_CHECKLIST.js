#!/usr/bin/env node

/**
 * Quick deployment checklist script
 * Run: node DEPLOYMENT_CHECKLIST.js
 */

const fs = require('fs');
const path = require('path');

const checks = [
  {
    name: 'Backend .env configured',
    check: () => fs.existsSync(path.join(__dirname, 'backend/.env')),
    fix: 'cp backend/.env.example backend/.env && fill in your values'
  },
  {
    name: 'Frontend .env configured',
    check: () => fs.existsSync(path.join(__dirname, '.env.local')),
    fix: 'cp .env.example .env.local && fill in your values'
  },
  {
    name: 'Backend package.json exists',
    check: () => fs.existsSync(path.join(__dirname, 'backend/package.json')),
    fix: 'Ensure backend/ folder structure is correct'
  },
  {
    name: 'Frontend package.json exists',
    check: () => fs.existsSync(path.join(__dirname, 'package.json')),
    fix: 'Ensure root package.json exists'
  },
  {
    name: 'Supabase schema exists',
    check: () => fs.existsSync(path.join(__dirname, 'backend/database/schema.sql')),
    fix: 'Create database/schema.sql with your Supabase schema'
  },
  {
    name: 'Git repository initialized',
    check: () => fs.existsSync(path.join(__dirname, '.git')),
    fix: 'Run: git init && git add . && git commit -m "Initial commit"'
  },
];

console.log('\n📋 Mental Health App - Deployment Checklist\n');

let passed = 0;
let failed = 0;

checks.forEach(({ name, check, fix }) => {
  if (check()) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   → Fix: ${fix}\n`);
    failed++;
  }
});

console.log(`\n Summary: ${passed}/${checks.length} checks passed\n`);

if (failed === 0) {
  console.log('🎉 You\'re ready to deploy!');
  console.log('\nNext steps:');
  console.log('1. Push code to GitHub: git push -u origin main');
  console.log('2. Deploy backend to Render: See RENDER_SETUP.md');
  console.log('3. Deploy frontend to Vercel: See VERCEL_SETUP.md');
  console.log('4. Update CORS in backend with your Vercel URL');
} else {
  console.log(`⚠️  Fix the ${failed} issue(s) above before deploying`);
  process.exit(1);
}
