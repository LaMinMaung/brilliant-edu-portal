# 🧪 Phase 8: Comprehensive QA & Testing Plan

Complete testing strategy for the LMS system covering functional, security, and performance testing.

---

## **Table of Contents**

1. [Testing Strategy Overview](#1-testing-strategy-overview)
2. [Authentication Testing](#2-authentication-testing)
3. [Grade Submission Flow Testing](#3-grade-submission-flow-testing)
4. [Role Permission Testing](#4-role-permission-testing)
5. [Edge Cases & Boundary Testing](#5-edge-cases--boundary-testing)
6. [Manual Testing Checklist](#6-manual-testing-checklist)
7. [Automated Testing Examples](#7-automated-testing-examples)

---

## **1. Testing Strategy Overview**

### **Testing Pyramid**

```
                    ▲
                   / \
                  /   \
                 / E2E \          10% - End-to-End Tests
                /-------\         (Selenium, Playwright)
               /  API    \        
              /   Tests   \       30% - Integration Tests
             /-------------\      (Supertest, Jest)
            /   Unit Tests  \     
           /-----------------\    60% - Unit Tests
          /___________________\   (Jest, Vitest)
```

### **Test Coverage Goals**

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| Critical Paths (Auth, Grades) | 100% | High |
| Business Logic | 90% | High |
| API Endpoints | 85% | High |
| UI Components | 70% | Medium |
| Utility Functions | 80% | Medium |

### **Testing Environments**

- **Local:** Developer machine (SQLite/PostgreSQL)
- **Staging:** Cloud environment (mirrors production)
- **Production:** Live system (limited testing, monitoring only)

---

## **2. Authentication Testing**

### **2.1 Functional Test Cases**

#### **TC-AUTH-001: Successful Login**

**Precondition:** User exists with email `student@test.com`, password `Password123!`, role `student`

**Steps:**
1. Navigate to `/login`
2. Enter email: `student@test.com`
3. Enter password: `Password123!`
4. Click "Sign In"

**Expected Result:**
- ✅ User redirected to `/portal/student/dashboard`
- ✅ JWT token stored in localStorage/cookies
- ✅ User name displayed in portal sidebar
- ✅ No error messages

**Actual Result:** _[To be filled during testing]_

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-002: Login with Invalid Email**

**Steps:**
1. Navigate to `/login`
2. Enter email: `nonexistent@test.com`
3. Enter password: `Password123!`
4. Click "Sign In"

**Expected Result:**
- ✅ Error message: "Invalid email or password"
- ✅ User remains on login page
- ✅ No token stored
- ❌ Should NOT reveal "User not found" (security)

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-003: Login with Invalid Password**

**Steps:**
1. Navigate to `/login`
2. Enter email: `student@test.com`
3. Enter password: `WrongPassword123!`
4. Click "Sign In"

**Expected Result:**
- ✅ Error message: "Invalid email or password"
- ✅ User remains on login page
- ✅ No token stored

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-004: Login with Empty Fields**

**Steps:**
1. Navigate to `/login`
2. Leave email and password empty
3. Click "Sign In"

**Expected Result:**
- ✅ Browser validation prevents submission
- ✅ "Email is required" message shown
- ✅ "Password is required" message shown

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-005: Token Expiration Handling**

**Precondition:** User logged in with token expiring in 15 minutes

**Steps:**
1. Log in successfully
2. Wait 16 minutes (or manually set expired token)
3. Make API request (e.g., fetch grades)

**Expected Result:**
- ✅ API returns 401 Unauthorized
- ✅ Error code: `TOKEN_EXPIRED`
- ✅ Frontend redirects to login page
- ✅ User shown "Session expired. Please login again."

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-006: Logout**

**Precondition:** User logged in

**Steps:**
1. Click "Logout" button in portal sidebar
2. Verify redirection to login page
3. Try accessing `/portal/student/dashboard` directly

**Expected Result:**
- ✅ Token cleared from storage
- ✅ Redirected to `/login`
- ✅ Direct access to dashboard redirects to login
- ✅ No authentication errors in console

**Status:** ⬜ Pass ⬜ Fail

---

### **2.2 Security Test Cases**

#### **TC-AUTH-SEC-001: SQL Injection in Login**

**Steps:**
1. Enter email: `admin' OR '1'='1`
2. Enter password: `anything`
3. Click "Sign In"

**Expected Result:**
- ✅ Login fails with "Invalid email or password"
- ✅ No database error exposed
- ✅ No user logged in
- ✅ Attack logged in security logs

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-SEC-002: Brute Force Protection**

**Steps:**
1. Make 6 failed login attempts in 1 minute
2. Try 7th login attempt

**Expected Result:**
- ✅ 7th attempt blocked
- ✅ Error: "Too many login attempts. Try again in 15 minutes."
- ✅ HTTP 429 (Too Many Requests)
- ✅ IP address logged

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-SEC-003: XSS in Login Form**

**Steps:**
1. Enter email: `<script>alert('XSS')</script>@test.com`
2. Enter password: `Password123!`
3. Click "Sign In"

**Expected Result:**
- ✅ No script execution
- ✅ Input sanitized
- ✅ Login fails gracefully

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-AUTH-SEC-004: JWT Token Tampering**

**Precondition:** User logged in as student

**Steps:**
1. Get JWT token from localStorage/cookies
2. Decode token and change `role` from `student` to `admin`
3. Re-encode token with same signature
4. Make API request to admin endpoint

**Expected Result:**
- ✅ Request fails with 401 Unauthorized
- ✅ Error: "Invalid token signature"
- ✅ User logged out

**Status:** ⬜ Pass ⬜ Fail

---

### **2.3 Performance Test Cases**

#### **TC-AUTH-PERF-001: Login Response Time**

**Steps:**
1. Measure time from "Sign In" click to dashboard load
2. Repeat 10 times
3. Calculate average

**Expected Result:**
- ✅ Average response time < 500ms
- ✅ 95th percentile < 1000ms

**Actual Results:**
- Min: _____ms
- Max: _____ms
- Avg: _____ms
- 95th: _____ms

**Status:** ⬜ Pass ⬜ Fail

---

## **3. Grade Submission Flow Testing**

### **3.1 Functional Test Cases**

#### **TC-GRADE-001: Teacher Adds Grade Successfully**

**Precondition:** 
- Teacher logged in
- Student enrolled in teacher's course
- Course: CS101 - Introduction to Programming

**Steps:**
1. Navigate to `/portal/teacher/grades`
2. Select course: CS101
3. Find student: John Doe
4. Enter midterm score: 85
5. Click Save icon
6. Wait for success message

**Expected Result:**
- ✅ Grade saved to database
- ✅ Status: PENDING (awaiting admin approval)
- ✅ Success message: "Grade saved successfully"
- ✅ Save icon disappears
- ✅ Green checkmark appears

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-002: Teacher Cannot Add Grade for Other Teacher's Course**

**Precondition:**
- Teacher A logged in
- Course CS202 taught by Teacher B
- Student enrolled in CS202

**Steps:**
1. Navigate to `/portal/teacher/grades`
2. Attempt to select CS202 (not in dropdown, or API call fails)

**Expected Result:**
- ✅ CS202 not visible in course dropdown
- ✅ If accessed via direct API call: 403 Forbidden
- ✅ Error: "Access denied. You can only manage your own courses."

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-003: Admin Approves Grade**

**Precondition:**
- Admin logged in
- Grade exists with status PENDING

**Steps:**
1. Navigate to `/portal/admin/grades` (hypothetical approval page)
2. Find pending grade for John Doe, CS101, Midterm: 85
3. Click "Approve" button
4. Confirm approval

**Expected Result:**
- ✅ Grade status changed to APPROVED
- ✅ Success message: "Grade approved"
- ✅ Student can now see grade in their portal
- ✅ Notification sent to student (if implemented)

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-004: Admin Rejects Grade**

**Precondition:**
- Admin logged in
- Grade exists with status PENDING

**Steps:**
1. Navigate to grade approval page
2. Find pending grade
3. Click "Reject" button
4. Enter reason: "Score exceeds max score"
5. Confirm rejection

**Expected Result:**
- ✅ Grade status changed to REJECTED
- ✅ Remarks updated with rejection reason
- ✅ Teacher notified of rejection
- ✅ Grade not visible to student

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-005: Student Views Own Grades**

**Precondition:**
- Student logged in
- Student has grades: Midterm 85 (APPROVED), Final (PENDING)

**Steps:**
1. Navigate to `/portal/student/grades`
2. View grades table

**Expected Result:**
- ✅ Midterm shows: 85% with green checkmark
- ✅ Final shows: "PENDING" badge (yellow)
- ✅ Only approved grades contribute to GPA
- ✅ Pending notice displayed at top

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-006: Student Cannot View Other Student's Grades**

**Precondition:**
- Student A logged in
- Student B has grades in system

**Steps:**
1. Attempt to access Student B's grades via API:
   `GET /api/grades/student/{studentB_id}`
2. Check response

**Expected Result:**
- ✅ 403 Forbidden
- ✅ Error: "Access denied. You can only view your own grades."
- ✅ No grade data returned

**Status:** ⬜ Pass ⬜ Fail

---

### **3.2 Validation Test Cases**

#### **TC-GRADE-VAL-001: Invalid Score (Negative)**

**Steps:**
1. Teacher enters midterm score: -10
2. Attempt to save

**Expected Result:**
- ✅ Validation error before API call
- ✅ Error: "Score must be between 0 and 100"
- ✅ Save button disabled or error shown

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-VAL-002: Invalid Score (Exceeds Maximum)**

**Steps:**
1. Teacher enters final score: 150
2. Attempt to save

**Expected Result:**
- ✅ Validation error
- ✅ Error: "Score cannot exceed 100"

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-VAL-003: Decimal Score Handling**

**Steps:**
1. Teacher enters quiz score: 87.5
2. Save grade

**Expected Result:**
- ✅ Decimal accepted and saved correctly
- ✅ Displays as 87.5% in student view

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-VAL-004: Empty Score**

**Steps:**
1. Teacher leaves score field empty
2. Attempt to save

**Expected Result:**
- ✅ Validation error
- ✅ Error: "Score is required"

**Status:** ⬜ Pass ⬜ Fail

---

### **3.3 Data Integrity Test Cases**

#### **TC-GRADE-DATA-001: Concurrent Grade Updates**

**Scenario:** Two admins approve the same grade simultaneously

**Steps:**
1. Admin A opens grade approval page
2. Admin B opens same grade approval page
3. Admin A clicks "Approve" (takes 2 seconds to process)
4. Admin B clicks "Reject" (takes 1 second to process)

**Expected Result:**
- ✅ First request (Admin B's reject) succeeds
- ✅ Second request (Admin A's approve) fails with conflict error
- ✅ Error: "Grade has already been processed"
- ✅ Final state: REJECTED (whichever processed first)

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-GRADE-DATA-002: GPA Calculation Accuracy**

**Precondition:**
- Student has 3 courses, each 3 credits
- Scores: 90, 85, 95

**Steps:**
1. Calculate expected GPA:
   - 90% = 3.6 GPA (90/25)
   - 85% = 3.4 GPA
   - 95% = 3.8 GPA
   - Weighted: (3.6×3 + 3.4×3 + 3.8×3) / 9 = 3.6
2. View student dashboard

**Expected Result:**
- ✅ Displayed GPA: 3.60
- ✅ Calculation matches manual calculation

**Status:** ⬜ Pass ⬜ Fail

---

## **4. Role Permission Testing**

### **4.1 Student Role Tests**

| Test ID | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| TC-ROLE-STU-001 | Access `/portal/student/dashboard` | ✅ Allowed | ⬜ |
| TC-ROLE-STU-002 | Access `/portal/teacher/dashboard` | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-STU-003 | Access `/portal/admin/dashboard` | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-STU-004 | View own grades | ✅ Allowed | ⬜ |
| TC-ROLE-STU-005 | View other student's grades | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-STU-006 | Modify own grade via API | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-STU-007 | Delete own grade | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-STU-008 | Enroll in course | ✅ Allowed (creates PENDING) | ⬜ |
| TC-ROLE-STU-009 | Submit assignment | ✅ Allowed | ⬜ |
| TC-ROLE-STU-010 | Create course | ❌ 403 Forbidden | ⬜ |

### **4.2 Teacher Role Tests**

| Test ID | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| TC-ROLE-TCH-001 | Access `/portal/teacher/dashboard` | ✅ Allowed | ⬜ |
| TC-ROLE-TCH-002 | Access `/portal/student/dashboard` | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-TCH-003 | Access `/portal/admin/dashboard` | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-TCH-004 | Add grade for own course | ✅ Allowed | ⬜ |
| TC-ROLE-TCH-005 | Add grade for other teacher's course | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-TCH-006 | Edit own grade (before approval) | ✅ Allowed | ⬜ |
| TC-ROLE-TCH-007 | Approve grade | ❌ 403 Forbidden (admin only) | ⬜ |
| TC-ROLE-TCH-008 | View student roster (own courses) | ✅ Allowed | ⬜ |
| TC-ROLE-TCH-009 | View student roster (other courses) | ❌ 403 Forbidden | ⬜ |
| TC-ROLE-TCH-010 | Delete user | ❌ 403 Forbidden | ⬜ |

### **4.3 Admin Role Tests**

| Test ID | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| TC-ROLE-ADM-001 | Access all portal dashboards | ✅ Allowed (all 3) | ⬜ |
| TC-ROLE-ADM-002 | Approve grade | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-003 | Reject grade | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-004 | Create user (any role) | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-005 | Delete user | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-006 | Create course | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-007 | Delete course | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-008 | Approve enrollment | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-009 | View all grades | ✅ Allowed | ⬜ |
| TC-ROLE-ADM-010 | Modify system settings | ✅ Allowed | ⬜ |

---

## **5. Edge Cases & Boundary Testing**

### **5.1 Data Boundary Tests**

#### **TC-EDGE-001: Maximum String Length**

**Test:** User name field (max 100 characters)

**Input:** 101-character string

**Expected Result:**
- ✅ Validation error: "Name must be less than 100 characters"
- ✅ Database constraint prevents save

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-EDGE-002: Minimum Password Length**

**Input:** Password with 7 characters (min is 8)

**Expected Result:**
- ✅ Validation error: "Password must be at least 8 characters"

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-EDGE-003: Score Precision**

**Input:** Score with many decimals: 87.123456789

**Expected Result:**
- ✅ Rounded to 2 decimal places: 87.12
- ✅ Or validation error if more than 2 decimals not allowed

**Status:** ⬜ Pass ⬜ Fail

---

### **5.2 Null/Empty Data Tests**

#### **TC-EDGE-004: Null Email**

**Input:** Email field = null

**Expected Result:**
- ✅ 400 Bad Request
- ✅ Error: "Email is required"

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-EDGE-005: Empty Grade Remarks**

**Input:** Remarks field = "" (empty string)

**Expected Result:**
- ✅ Allowed (remarks are optional)
- ✅ Saved as empty string or null

**Status:** ⬜ Pass ⬜ Fail

---

### **5.3 Race Condition Tests**

#### **TC-EDGE-006: Simultaneous Enrollment**

**Scenario:** Course has 1 spot left, 2 students enroll simultaneously

**Expected Result:**
- ✅ First request succeeds
- ✅ Second request fails: "Course is full"
- ✅ Database transaction ensures consistency

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-EDGE-007: Double Click on Submit**

**Scenario:** User double-clicks "Submit Assignment" button

**Expected Result:**
- ✅ Only one submission created
- ✅ Button disabled after first click
- ✅ Or idempotency key prevents duplicate

**Status:** ⬜ Pass ⬜ Fail

---

### **5.4 Large Dataset Tests**

#### **TC-EDGE-008: Student with 100+ Grades**

**Scenario:** Student has 100 grades across multiple semesters

**Steps:**
1. Navigate to grades page
2. Measure load time

**Expected Result:**
- ✅ Page loads in < 2 seconds
- ✅ Pagination implemented (20 per page)
- ✅ No browser crash or freeze

**Status:** ⬜ Pass ⬜ Fail

---

#### **TC-EDGE-009: Course with 500 Students**

**Scenario:** Teacher views gradebook for course with 500 students

**Expected Result:**
- ✅ Table loads with virtualization (only visible rows rendered)
- ✅ Search/filter functionality works smoothly
- ✅ Save operations complete in < 1 second

**Status:** ⬜ Pass ⬜ Fail

---

## **6. Manual Testing Checklist**

### **6.1 Pre-Deployment Checklist**

#### **Environment Setup**
- [ ] Test environment mirrors production (database, server config)
- [ ] Test data populated (users, courses, enrollments, grades)
- [ ] Environment variables correctly set
- [ ] HTTPS enabled (or localhost exception)

#### **Authentication Flow**
- [ ] Can register new student account
- [ ] Can register new teacher account
- [ ] Can login with valid credentials (all 3 roles)
- [ ] Cannot login with invalid email
- [ ] Cannot login with wrong password
- [ ] Session persists after page refresh
- [ ] Logout clears session completely
- [ ] Cannot access protected routes when logged out
- [ ] Token expiration redirects to login

#### **Student Portal**
- [ ] Dashboard displays correct stats (courses, GPA, assignments)
- [ ] Can view enrolled courses
- [ ] Can view grades (only approved ones)
- [ ] Pending grades show "PENDING" badge
- [ ] Can enroll in available courses (status: PENDING)
- [ ] Can submit assignments with file upload
- [ ] Can view assignment submission status
- [ ] Cannot view other students' data
- [ ] Can update profile information
- [ ] Responsive on mobile devices

#### **Teacher Portal**
- [ ] Dashboard shows courses taught, student count
- [ ] Can view course roster (only own courses)
- [ ] Can add grades for enrolled students
- [ ] Can edit pending grades
- [ ] Cannot edit approved/rejected grades
- [ ] Can create assignments with deadlines
- [ ] Can view student submissions
- [ ] Cannot access other teachers' courses
- [ ] Grade validation works (0-100 range)

#### **Admin Portal**
- [ ] Can create users (all roles)
- [ ] Can search/filter users
- [ ] Can delete users (with confirmation)
- [ ] Can create courses
- [ ] Can assign teachers to courses
- [ ] Can approve pending enrollments
- [ ] Can reject pending enrollments
- [ ] Can approve pending grades
- [ ] Can reject pending grades with reason
- [ ] Can modify system settings

#### **UI/UX**
- [ ] No console errors in browser
- [ ] No broken images or 404s
- [ ] Loading states displayed during API calls
- [ ] Error messages are user-friendly
- [ ] Success messages appear after actions
- [ ] Buttons have hover states
- [ ] Forms have proper validation messages
- [ ] Responsive design works on mobile/tablet
- [ ] Sidebar navigation collapses on mobile
- [ ] Navbar doesn't overflow on small screens

#### **Security**
- [ ] Cannot access admin routes as student
- [ ] Cannot access teacher routes as student
- [ ] Cannot modify other users' data
- [ ] SQL injection attempts fail gracefully
- [ ] XSS attempts don't execute scripts
- [ ] CSRF protection enabled (if using cookies)
- [ ] Rate limiting prevents brute force
- [ ] Passwords hashed in database (never plaintext)
- [ ] JWT tokens expire after configured time

#### **Performance**
- [ ] Login completes in < 500ms
- [ ] Dashboard loads in < 1 second
- [ ] Grades table loads in < 2 seconds
- [ ] No memory leaks (check browser dev tools)
- [ ] Images optimized (< 500KB each)
- [ ] API responses < 200ms for simple queries

### **6.2 Regression Testing Checklist**

Run after any code changes to ensure existing functionality still works.

#### **Critical Paths (Must Pass)**
- [ ] Login → Dashboard → View Grades → Logout
- [ ] Teacher Login → Add Grade → View in Student Portal
- [ ] Admin Login → Approve Grade → Verify in Student Portal
- [ ] Student Login → Enroll Course → Admin Approves → View in My Courses

#### **Common User Flows**
- [ ] Student views grades for multiple semesters
- [ ] Teacher adds grades for multiple students
- [ ] Admin bulk-approves enrollments
- [ ] Student submits assignment before deadline
- [ ] Student submits assignment after deadline (late flag)

---

## **7. Automated Testing Examples**

### **7.1 Unit Tests (Jest/Vitest)**

```typescript
// src/utils/__tests__/password.util.test.ts
import { hashPassword, verifyPassword, validatePasswordStrength } from '../password.util';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'Password123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Password123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Password123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Password123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('Strong123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('Sh0rt!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});
```

### **7.2 Integration Tests (Supertest)**

```typescript
// src/__tests__/auth.integration.test.ts
import request from 'supertest';
import app from '../app';
import prisma from '../config/database';

describe('Authentication API', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          name: 'John Doe',
          role: 'student',
          studentId: 'STU001'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('student@test.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject registration with existing email', async () => {
      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          name: 'John Doe',
          role: 'student'
        });

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          name: 'Jane Doe',
          role: 'student'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already registered');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'weak',
          passwordConfirm: 'weak',
          name: 'John Doe',
          role: 'student'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          name: 'John Doe',
          role: 'student'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.role).toBe('student');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });
});
```

### **7.3 API Authorization Tests**

```typescript
// src/__tests__/grade.authorization.test.ts
import request from 'supertest';
import app from '../app';
import prisma from '../config/database';

describe('Grade API Authorization', () => {
  let studentToken: string;
  let teacherToken: string;
  let adminToken: string;
  let studentId: string;
  let teacherId: string;
  let courseId: string;

  beforeAll(async () => {
    // Create student
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'student@test.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        name: 'Student User',
        role: 'student'
      });
    studentToken = studentRes.body.data.token;
    studentId = studentRes.body.data.user.id;

    // Create teacher
    const teacherRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teacher@test.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        name: 'Teacher User',
        role: 'teacher'
      });
    teacherToken = teacherRes.body.data.token;
    teacherId = teacherRes.body.data.user.id;

    // Create admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        name: 'Admin User',
        role: 'admin'
      });
    adminToken = adminRes.body.data.token;

    // Create course
    const course = await prisma.course.create({
      data: {
        code: 'CS101',
        title: 'Introduction to Programming',
        credits: 3,
        teacherId: teacherId,
        semester: 'Fall 2024',
        status: 'ACTIVE'
      }
    });
    courseId = course.id;

    // Enroll student
    await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        status: 'ENROLLED',
        enrolledDate: new Date()
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/grades/student/:studentId', () => {
    it('should allow student to view own grades', async () => {
      const response = await request(app)
        .get(`/api/grades/student/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent student from viewing other student grades', async () => {
      // Create another student
      const otherStudentRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other@test.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          name: 'Other Student',
          role: 'student'
        });

      const response = await request(app)
        .get(`/api/grades/student/${otherStudentRes.body.data.user.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN_RESOURCE');
    });

    it('should allow admin to view any student grades', async () => {
      const response = await request(app)
        .get(`/api/grades/student/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/grades', () => {
    it('should allow teacher to add grade for own course', async () => {
      const response = await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentId,
          courseId,
          assessmentType: 'MIDTERM',
          score: 85,
          remarks: 'Good work'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grade.status).toBe('PENDING');
    });

    it('should prevent student from adding grades', async () => {
      const response = await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId,
          courseId,
          assessmentType: 'FINAL',
          score: 90
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/grades/:id/approve', () => {
    let gradeId: string;

    beforeEach(async () => {
      // Create grade
      const grade = await prisma.grade.create({
        data: {
          studentId,
          courseId,
          assessmentType: 'QUIZ',
          score: 88,
          maxScore: 100,
          status: 'PENDING',
          gradedById: teacherId
        }
      });
      gradeId = grade.id;
    });

    it('should allow admin to approve grade', async () => {
      const response = await request(app)
        .patch(`/api/grades/${gradeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grade.status).toBe('APPROVED');
    });

    it('should prevent teacher from approving grade', async () => {
      const response = await request(app)
        .patch(`/api/grades/${gradeId}/approve`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should prevent student from approving grade', async () => {
      const response = await request(app)
        .patch(`/api/grades/${gradeId}/approve`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });
});
```

### **7.4 E2E Tests (Playwright)**

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Authentication Flow', () => {
  test('should complete full student login flow', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // 2. Verify login page loaded
    await expect(page.locator('h1')).toContainText('Student Portal Login');
    
    // 3. Fill login form
    await page.fill('input[type="email"]', 'student@bei.edu');
    await page.fill('input[type="password"]', 'student123');
    
    // 4. Submit form
    await page.click('button[type="submit"]');
    
    // 5. Wait for navigation to dashboard
    await page.waitForURL('**/portal/student/dashboard');
    
    // 6. Verify dashboard loaded
    await expect(page.locator('h2')).toContainText('Welcome back');
    
    // 7. Verify stats cards present
    await expect(page.locator('text=Enrolled Courses')).toBeVisible();
    await expect(page.locator('text=Pending Assignments')).toBeVisible();
    
    // 8. Navigate to grades
    await page.click('text=Grades');
    await page.waitForURL('**/portal/student/grades');
    
    // 9. Verify grades table loaded
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Subject")')).toBeVisible();
    
    // 10. Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');
    
    // 11. Verify redirected to login
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('should prevent access to protected routes when logged out', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('http://localhost:5173/portal/student/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verify error message appears
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    
    // Verify still on login page
    await expect(page).toHaveURL(/.*\/login/);
  });
});
```

---

## **8. Testing Execution Plan**

### **8.1 Test Execution Schedule**

| Phase | Duration | Focus | Responsible |
|-------|----------|-------|-------------|
| **Unit Testing** | 1 week | Test utilities, helpers, validators | Developers |
| **Integration Testing** | 1 week | Test API endpoints, database operations | Developers |
| **Manual Testing** | 3 days | Execute manual checklist | QA Team |
| **Regression Testing** | 2 days | Re-test after bug fixes | QA Team |
| **UAT (User Acceptance)** | 1 week | Real users test in staging | Product Owner + Users |
| **Performance Testing** | 2 days | Load testing, response times | DevOps |
| **Security Testing** | 3 days | Penetration testing, vulnerability scan | Security Team |

### **8.2 Bug Tracking Template**

```
BUG ID: BUG-001
Title: Student can view other students' grades
Severity: Critical
Priority: High
Status: Open

Environment: Staging
Browser: Chrome 120.0
Date Found: 2024-01-15

Steps to Reproduce:
1. Log in as student@test.com
2. Navigate to /api/grades/student/OTHER_STUDENT_ID
3. Observe response

Expected Result:
- 403 Forbidden error
- Error message: "Access denied"

Actual Result:
- 200 OK
- Other student's grades returned

Root Cause:
- Missing ownership check in getStudentGrades controller
- Authorization middleware not verifying studentId matches req.user.id

Fix:
- Add ownership verification before returning grades
- Add integration test to prevent regression

Assignee: Backend Dev
Fixed In: PR #123
Verified By: QA Team
Closed Date: 2024-01-16
```

---

**✅ Phase 8 Complete!** You now have:
- Comprehensive test case library (50+ test cases)
- Role-based permission testing matrix
- Edge case and boundary testing scenarios
- Manual testing checklist (100+ items)
- Automated testing examples (Unit, Integration, E2E)
- Bug tracking template
- Test execution plan

**Ready for deployment with confidence!** 🚀