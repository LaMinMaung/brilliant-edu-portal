# 🚀 Node.js + Express Alternative Architecture

This document provides a complete Node.js/Express backend implementation as an alternative to PocketBase for the LMS system.

---

## **📁 Folder Structure**

```
lms-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection
│   │   └── env.ts               # Environment variables
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts   # Login, Register, Logout
│   │   ├── course.controller.ts # Course CRUD
│   │   ├── enrollment.controller.ts
│   │   ├── grade.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT verification
│   │   ├── role.middleware.ts   # Role-based access control
│   │   ├── validate.middleware.ts # Request validation
│   │   └── error.middleware.ts  # Error handling
│   │
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Course.model.ts
│   │   ├── Enrollment.model.ts
│   │   ├── Grade.model.ts
│   │   ├── Assignment.model.ts
│   │   └── Submission.model.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── course.routes.ts
│   │   ├── enrollment.routes.ts
│   │   ├── grade.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts      # Business logic for auth
│   │   ├── email.service.ts     # Email notifications
│   │   └── file.service.ts      # File upload handling
│   │
│   ├── utils/
│   │   ├── jwt.util.ts          # JWT helper functions
│   │   ├── password.util.ts     # bcrypt helpers
│   │   └── response.util.ts     # Standardized responses
│   │
│   ├── types/
│   │   └── express.d.ts         # TypeScript type extensions
│   │
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Server entry point
│
├── prisma/                      # Prisma ORM
│   ├── schema.prisma
│   └── migrations/
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## **🔧 Setup & Installation**

### **1. Initialize Project**

```bash
mkdir lms-backend
cd lms-backend
npm init -y
```

### **2. Install Dependencies**

```bash
# Core dependencies
npm install express cors dotenv bcryptjs jsonwebtoken cookie-parser

# TypeScript
npm install -D typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/cookie-parser ts-node-dev

# Validation
npm install zod express-validator

# Database (choose one)
npm install @prisma/client  # For Prisma ORM
npm install pg              # PostgreSQL driver

# Development tools
npm install -D prisma nodemon
```

### **3. Initialize TypeScript**

```bash
npx tsc --init
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### **4. Initialize Prisma**

```bash
npx prisma init
```

---

## **📊 Database Schema (Prisma)**

**prisma/schema.prisma:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  TEACHER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  GRADUATED
  INACTIVE
}

enum CourseStatus {
  ACTIVE
  COMPLETED
  UPCOMING
  CANCELLED
}

enum EnrollmentStatus {
  PENDING
  ENROLLED
  DROPPED
  COMPLETED
}

enum GradeStatus {
  PENDING
  APPROVED
  REJECTED
}

enum AssessmentType {
  MIDTERM
  FINAL
  QUIZ
  ASSIGNMENT
  PROJECT
}

enum AssignmentStatus {
  ACTIVE
  CLOSED
}

enum SubmissionStatus {
  SUBMITTED
  LATE
  GRADED
  RETURNED
}

model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String
  role          UserRole
  firstName     String
  lastName      String
  studentId     String?     @unique
  phone         String?
  dateOfBirth   DateTime?
  status        UserStatus  @default(ACTIVE)
  avatarUrl     String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  coursesTaught   Course[]      @relation("CourseTeacher")
  enrollments     Enrollment[]
  grades          Grade[]       @relation("StudentGrades")
  gradesGiven     Grade[]       @relation("GradedBy")
  assignmentsCreated Assignment[] @relation("AssignmentCreator")
  submissions     Submission[]

  @@map("users")
}

model Course {
  id            String        @id @default(uuid())
  code          String        @unique
  title         String
  description   String?
  credits       Int
  teacherId     String
  department    String?
  semester      String
  academicYear  String?
  maxStudents   Int?
  status        CourseStatus  @default(ACTIVE)
  startDate     DateTime?
  endDate       DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  teacher       User          @relation("CourseTeacher", fields: [teacherId], references: [id])
  enrollments   Enrollment[]
  grades        Grade[]
  assignments   Assignment[]

  @@map("courses")
}

model Enrollment {
  id              String            @id @default(uuid())
  studentId       String
  courseId        String
  status          EnrollmentStatus  @default(PENDING)
  enrolledDate    DateTime?
  dropDate        DateTime?
  completionDate  DateTime?
  finalGrade      String?
  finalScore      Float?
  gpaPoints       Float?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  student   User    @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course    Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId])
  @@map("enrollments")
}

model Grade {
  id              String          @id @default(uuid())
  studentId       String
  courseId        String
  assessmentType  AssessmentType
  score           Float
  maxScore        Float           @default(100)
  weight          Float?
  status          GradeStatus     @default(PENDING)
  remarks         String?
  gradedById      String?
  gradedDate      DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  student   User    @relation("StudentGrades", fields: [studentId], references: [id], onDelete: Cascade)
  course    Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  gradedBy  User?   @relation("GradedBy", fields: [gradedById], references: [id])

  @@map("grades")
}

model Assignment {
  id                  String            @id @default(uuid())
  courseId            String
  title               String
  description         String?
  dueDate             DateTime
  maxScore            Float             @default(100)
  weight              Float?
  status              AssignmentStatus  @default(ACTIVE)
  allowLateSubmission Boolean           @default(false)
  latePenaltyPercent  Float             @default(0)
  createdById         String
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  // Relations
  course      Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdBy   User         @relation("AssignmentCreator", fields: [createdById], references: [id])
  submissions Submission[]

  @@map("assignments")
}

model Submission {
  id              String            @id @default(uuid())
  assignmentId    String
  studentId       String
  submittedDate   DateTime          @default(now())
  submissionText  String?
  fileUrl         String?
  score           Float?
  feedback        String?
  status          SubmissionStatus  @default(SUBMITTED)
  gradedById      String?
  gradedDate      DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  assignment  Assignment  @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student     User        @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([assignmentId, studentId])
  @@map("submissions")
}
```

**Run migrations:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## **🔐 Environment Variables**

**.env:**
```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lms_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## **💻 Core Implementation**

### **1. Database Configuration**

**src/config/database.ts:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

---

### **2. Authentication Middleware**

**src/middleware/auth.middleware.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};
```

---

### **3. Role-Based Access Control**

**src/middleware/role.middleware.ts:**
```typescript
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Insufficient permissions' 
      });
    }

    next();
  };
};

// Shorthand helpers
export const requireStudent = requireRole(UserRole.STUDENT);
export const requireTeacher = requireRole(UserRole.TEACHER, UserRole.ADMIN);
export const requireAdmin = requireRole(UserRole.ADMIN);
```

---

### **4. Auth Controller**

**src/controllers/auth.controller.ts:**
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';

// Register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, studentId } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as UserRole || UserRole.STUDENT,
        studentId: role === 'STUDENT' ? studentId : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is suspended or inactive' 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          studentId: user.studentId,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: error.message 
    });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user',
      error: error.message 
    });
  }
};
```

---

### **5. Grade Controller**

**src/controllers/grade.controller.ts:**
```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { UserRole, GradeStatus } from '@prisma/client';

// Get student grades
export const getStudentGrades = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;

    // Authorization: Students can only view their own grades
    if (req.user!.role === UserRole.STUDENT && req.user!.id !== studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            code: true,
            title: true,
            semester: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { grades },
    });
  } catch (error: any) {
    console.error('Get grades error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch grades',
      error: error.message 
    });
  }
};

// Add grade (teacher only)
export const addGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, courseId, assessmentType, score, maxScore, remarks } = req.body;

    // Verify teacher owns the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    if (course.teacherId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to grade this course' 
      });
    }

    // Verify student is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ENROLLED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not enrolled in this course' 
      });
    }

    // Create grade
    const grade = await prisma.grade.create({
      data: {
        studentId,
        courseId,
        assessmentType,
        score: parseFloat(score),
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        remarks,
        status: GradeStatus.PENDING,
        gradedById: req.user!.id,
        gradedDate: new Date(),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Grade added successfully',
      data: { grade },
    });
  } catch (error: any) {
    console.error('Add grade error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add grade',
      error: error.message 
    });
  }
};

// Approve grade (admin only)
export const approveGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { gradeId } = req.params;

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        status: GradeStatus.APPROVED,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Grade approved successfully',
      data: { grade },
    });
  } catch (error: any) {
    console.error('Approve grade error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve grade',
      error: error.message 
    });
  }
};

// Reject grade (admin only)
export const rejectGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { gradeId } = req.params;
    const { reason } = req.body;

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        status: GradeStatus.REJECTED,
        remarks: reason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Grade rejected',
      data: { grade },
    });
  } catch (error: any) {
    console.error('Reject grade error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject grade',
      error: error.message 
    });
  }
};
```

---

### **6. Routes Setup**

**src/routes/auth.routes.ts:**
```typescript
import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;
```

**src/routes/grade.routes.ts:**
```typescript
import { Router } from 'express';
import { 
  getStudentGrades, 
  addGrade, 
  approveGrade, 
  rejectGrade 
} from '../controllers/grade.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher, requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.get('/student/:studentId', authenticate, getStudentGrades);
router.post('/', authenticate, requireTeacher, addGrade);
router.patch('/:gradeId/approve', authenticate, requireAdmin, approveGrade);
router.patch('/:gradeId/reject', authenticate, requireAdmin, rejectGrade);

export default router;
```

---

### **7. Express App Setup**

**src/app.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import gradeRoutes from './routes/grade.routes';
// Import other routes...

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);
// Add other routes...

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;
```

**src/server.ts:**
```typescript
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

---

### **8. Package.json Scripts**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  }
}
```

---

## **🔗 API Endpoints Reference**

### **Authentication**
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
GET    /api/auth/me                # Get current user (protected)
```

### **Courses**
```
GET    /api/courses                # Get all courses (public)
GET    /api/courses/:id            # Get single course
POST   /api/courses                # Create course (teacher/admin)
PUT    /api/courses/:id            # Update course (teacher/admin)
DELETE /api/courses/:id            # Delete course (admin)
```

### **Enrollments**
```
GET    /api/enrollments            # Get all enrollments (admin)
POST   /api/enrollments            # Enroll in course (student)
GET    /api/enrollments/student/:studentId  # Get student enrollments
PUT    /api/enrollments/:id/approve # Approve enrollment (admin)
DELETE /api/enrollments/:id        # Drop course
```

### **Grades**
```
GET    /api/grades/student/:studentId  # Get student grades
POST   /api/grades                     # Add grade (teacher)
PUT    /api/grades/:id                 # Update grade (teacher)
PATCH  /api/grades/:id/approve         # Approve grade (admin)
PATCH  /api/grades/:id/reject          # Reject grade (admin)
```

---

## **🎯 Key Differences: PocketBase vs Node.js/Express**

| Feature | PocketBase | Node.js/Express |
|---------|-----------|-----------------|
| **Setup Time** | 5 minutes | 2-4 hours |
| **Code Required** | Minimal (migrations only) | Full backend code |
| **Database** | Built-in SQLite | PostgreSQL/MySQL (your choice) |
| **Auth** | Built-in JWT + OAuth2 | DIY with JWT |
| **Real-time** | Built-in SSE | Requires Socket.io |
| **File Storage** | Built-in | DIY (S3, Cloudinary) |
| **Admin UI** | Built-in dashboard | Need to build |
| **Scaling** | Good for 0-10K users | Excellent for any scale |
| **Flexibility** | Limited to PocketBase features | Complete control |
| **Learning Curve** | Low | Medium-High |

---

**✅ Phase 3 & 4 Complete!** The full LMS portal is now live with:
- Teacher Portal (gradebook, assignments, student roster, courses)
- Admin Portal (user management, course management, enrollment approval, settings)
- Complete Node.js/Express alternative architecture with Prisma ORM

**What's next?** Would you like to add real-time notifications, assignment file uploads, or transcript generation features?