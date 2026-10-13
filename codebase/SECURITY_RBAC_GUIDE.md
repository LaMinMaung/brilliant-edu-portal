# 🔒 Phase 7: Role-Based Access Control (RBAC) Implementation

Complete security guide for implementing role-based access control in the LMS system.

---

## **Table of Contents**

1. [Architecture Overview](#1-architecture-overview)
2. [Middleware Implementation](#2-middleware-implementation)
3. [Protected Routes](#3-protected-routes)
4. [Security Best Practices](#4-security-best-practices)
5. [Common Vulnerabilities & Mitigations](#5-common-vulnerabilities--mitigations)

---

## **1. Architecture Overview**

### **Three-Layer Security Model**

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Authentication Middleware (authenticate)       │
│  - Verify JWT token exists                              │
│  - Validate token signature                             │
│  - Check token expiration                               │
│  - Extract user payload (id, email, role)               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Authorization Middleware (requireRole)         │
│  - Check user role against allowed roles                │
│  - Return 403 if insufficient permissions               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Resource Authorization (controller logic)      │
│  - Verify ownership (student can only view own grades)  │
│  - Check resource-specific permissions                  │
│  - Validate business rules                              │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Response                              │
└─────────────────────────────────────────────────────────┘
```

### **Role Hierarchy**

| Role    | Access Level | Capabilities |
|---------|--------------|--------------|
| **Student** | Basic | View own grades, submit assignments, enroll in courses |
| **Teacher** | Elevated | Add/edit grades for own courses, manage assignments, view student roster |
| **Admin** | Full | Approve grades, manage users, configure system, full CRUD on all resources |

---

## **2. Middleware Implementation**

### **2.1 Authentication Middleware**

Verifies JWT token and attaches user to request object.

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    iat?: number;
    exp?: number;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authorization format. Use "Bearer <token>"',
        code: 'INVALID_AUTH_FORMAT'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // 2. Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET!
    ) as AuthRequest['user'];

    // 3. Optional: Check token blacklist (if implemented)
    // const isBlacklisted = await checkTokenBlacklist(token);
    // if (isBlacklisted) {
    //   return res.status(401).json({ 
    //     success: false, 
    //     message: 'Token has been revoked' 
    //   });
    // }

    // 4. Optional: Verify user still exists and is active
    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.id },
    //   select: { id: true, status: true }
    // });
    // 
    // if (!user || user.status !== 'ACTIVE') {
    //   return res.status(401).json({ 
    //     success: false, 
    //     message: 'User account is inactive or deleted' 
    //   });
    // }

    // 5. Attach user to request
    req.user = decoded;
    next();

  } catch (error: any) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token signature',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token not yet valid',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // Generic error
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};
```

### **2.2 Role-Based Authorization Middleware**

Checks if authenticated user has required role(s).

```typescript
// src/middleware/role.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

type UserRole = 'student' | 'teacher' | 'admin';

/**
 * Factory function that creates middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that can access the route
 * @returns Express middleware function
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Ensure user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // 2. Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    // 3. User has required role, proceed
    next();
  };
};

// Convenience middleware for common role checks
export const requireStudent = requireRole('student');
export const requireTeacher = requireRole('teacher', 'admin');
export const requireAdmin = requireRole('admin');

// Combination middleware for routes accessible by teachers OR admins
export const requireTeacherOrAdmin = requireRole('teacher', 'admin');

// Middleware that allows ANY authenticated user
export const requireAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};
```

### **2.3 Resource Ownership Middleware**

Validates that user owns or has permission to access specific resource.

```typescript
// src/middleware/ownership.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/database';

/**
 * Ensures student can only access their own resources
 * Use after authenticate middleware
 */
export const requireOwnResource = (resourceIdParam: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Admins bypass ownership checks
      if (userRole === 'admin') {
        return next();
      }

      // Students must own the resource
      if (userRole === 'student') {
        // For grade routes, check if grade belongs to student
        if (req.path.includes('/grades')) {
          const grade = await prisma.grade.findUnique({
            where: { id: resourceId },
            select: { student: true }
          });

          if (!grade || grade.student !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Access denied. You can only view your own grades.',
              code: 'NOT_RESOURCE_OWNER'
            });
          }
        }

        // For enrollment routes
        if (req.path.includes('/enrollments')) {
          const enrollment = await prisma.enrollment.findUnique({
            where: { id: resourceId },
            select: { studentId: true }
          });

          if (!enrollment || enrollment.studentId !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Access denied. You can only view your own enrollments.',
              code: 'NOT_RESOURCE_OWNER'
            });
          }
        }
      }

      // Teachers must own the course
      if (userRole === 'teacher') {
        if (req.path.includes('/courses')) {
          const course = await prisma.course.findUnique({
            where: { id: resourceId },
            select: { teacherId: true }
          });

          if (!course || course.teacherId !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Access denied. You can only manage your own courses.',
              code: 'NOT_RESOURCE_OWNER'
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify resource ownership'
      });
    }
  };
};
```

### **2.4 Rate Limiting Middleware**

Prevents brute force attacks and API abuse.

```typescript
// src/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Moderate limiter for grade submission
export const gradeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit to 10 grade submissions per minute
  message: {
    success: false,
    message: 'Too many grade submissions. Please slow down.',
    code: 'GRADE_RATE_LIMIT_EXCEEDED'
  },
});
```

---

## **3. Protected Routes**

### **3.1 Complete Route Examples**

```typescript
// src/routes/grade.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, requireStudent, requireTeacher, requireAdmin } from '../middleware/role.middleware';
import { gradeLimiter } from '../middleware/rateLimit.middleware';
import { 
  getStudentGrades, 
  addGrade, 
  updateGrade,
  approveGrade,
  rejectGrade,
  deleteGrade
} from '../controllers/grade.controller';

const router = Router();

/**
 * GET /api/grades/student/:studentId
 * Access: Student (own grades only), Teacher (their students), Admin (all)
 * Description: Get all grades for a specific student
 */
router.get(
  '/student/:studentId',
  authenticate,
  requireRole('student', 'teacher', 'admin'),
  getStudentGrades
);

/**
 * POST /api/grades
 * Access: Teacher, Admin
 * Description: Add a new grade
 * Rate Limited: 10 per minute
 */
router.post(
  '/',
  authenticate,
  requireTeacher,
  gradeLimiter,
  addGrade
);

/**
 * PUT /api/grades/:id
 * Access: Teacher (own courses), Admin
 * Description: Update an existing grade
 */
router.put(
  '/:id',
  authenticate,
  requireTeacher,
  updateGrade
);

/**
 * PATCH /api/grades/:id/approve
 * Access: Admin only
 * Description: Approve a pending grade
 */
router.patch(
  '/:id/approve',
  authenticate,
  requireAdmin,
  approveGrade
);

/**
 * PATCH /api/grades/:id/reject
 * Access: Admin only
 * Description: Reject a pending grade
 */
router.patch(
  '/:id/reject',
  authenticate,
  requireAdmin,
  rejectGrade
);

/**
 * DELETE /api/grades/:id
 * Access: Admin only
 * Description: Delete a grade (soft delete recommended)
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  deleteGrade
);

export default router;
```

### **3.2 Controller Implementation with Authorization**

```typescript
// src/controllers/grade.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

/**
 * Get student grades
 * Authorization logic:
 * - Students can only view their own grades
 * - Teachers can view grades for students in their courses
 * - Admins can view all grades
 */
export const getStudentGrades = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const currentUser = req.user!;

    // AUTHORIZATION CHECK 1: Students can only view their own grades
    if (currentUser.role === 'student' && currentUser.id !== studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own grades.',
        code: 'FORBIDDEN_RESOURCE'
      });
    }

    // AUTHORIZATION CHECK 2: Teachers can only view grades for their students
    if (currentUser.role === 'teacher') {
      // Get all courses taught by this teacher
      const teacherCourses = await prisma.course.findMany({
        where: { teacherId: currentUser.id },
        select: { id: true }
      });

      const courseIds = teacherCourses.map(c => c.id);

      // Check if student is enrolled in any of teacher's courses
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          courseId: { in: courseIds },
          status: 'ENROLLED'
        }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This student is not enrolled in your courses.',
          code: 'NOT_YOUR_STUDENT'
        });
      }
    }

    // Fetch grades
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            code: true,
            title: true,
            semester: true,
            teacher: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: { grades }
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

/**
 * Add new grade
 * Authorization logic:
 * - Teachers can only add grades for their own courses
 * - Admins can add grades for any course
 */
export const addGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, courseId, assessmentType, score, remarks } = req.body;
    const currentUser = req.user!;

    // AUTHORIZATION CHECK: Verify teacher owns the course
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    if (currentUser.role === 'teacher' && course.teacherId !== currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only add grades for your own courses.',
        code: 'NOT_YOUR_COURSE'
      });
    }

    // VALIDATION: Verify student is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    if (!enrollment || enrollment.status !== 'ENROLLED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Student is not enrolled in this course' 
      });
    }

    // Create grade
    const grade = await prisma.grade.create({
      data: {
        studentId,
        courseId,
        assessmentType,
        score: parseFloat(score),
        maxScore: 100,
        remarks,
        status: 'PENDING', // Requires admin approval
        gradedById: currentUser.id,
        gradedDate: new Date()
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        },
        course: {
          select: {
            code: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Grade added successfully. Pending admin approval.',
      data: { grade }
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

/**
 * Approve grade
 * Authorization: Admin only
 */
export const approveGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const grade = await prisma.grade.update({
      where: { id },
      data: {
        status: 'APPROVED',
        updatedAt: new Date()
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        },
        course: {
          select: {
            code: true,
            title: true
          }
        }
      }
    });

    // Optional: Send notification to student
    // await sendGradeNotification(grade.student.email, grade);

    res.status(200).json({
      success: true,
      message: 'Grade approved successfully',
      data: { grade }
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

/**
 * Reject grade
 * Authorization: Admin only
 */
export const rejectGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const grade = await prisma.grade.update({
      where: { id },
      data: {
        status: 'REJECTED',
        remarks: reason,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Grade rejected',
      data: { grade }
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

## **4. Security Best Practices**

### **4.1 JWT Token Security**

```typescript
// src/utils/jwt.util.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { 
      expiresIn: '15m', // Short-lived for security
      issuer: 'lms-api',
      audience: 'lms-client'
    }
  );
};

/**
 * Generate refresh token (long-lived)
 * Store hash in database to enable revocation
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET!,
    { 
      expiresIn: '7d',
      issuer: 'lms-api',
      audience: 'lms-client'
    }
  );
};

/**
 * Generate secure random token for password reset
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for storage (prevents token theft from database)
 */
export const hashToken = (token: string): string => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};
```

### **4.2 Password Security**

```typescript
// src/utils/password.util.ts
import bcrypt from 'bcryptjs';

/**
 * Hash password with bcrypt
 * Cost factor 10 = 2^10 iterations (good balance of security vs performance)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePasswordStrength = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
```

### **4.3 Input Validation & Sanitization**

```typescript
// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Generic validation middleware using Zod
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and sanitize request body
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};

// Example validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const addGradeSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  courseId: z.string().uuid('Invalid course ID'),
  assessmentType: z.enum(['MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT']),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  remarks: z.string().max(500, 'Remarks must be less than 500 characters').optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional()
}).strict(); // Reject unknown fields
```

### **4.4 Security Headers**

```typescript
// src/middleware/security.middleware.ts
import helmet from 'helmet';
import { Express } from 'express';

export const configureSecurityHeaders = (app: Express) => {
  // Use Helmet to set various HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  }));

  // Prevent clickjacking
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // Prevent MIME type sniffing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
};
```

### **4.5 CORS Configuration**

```typescript
// src/config/cors.config.ts
import cors from 'cors';

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
```

---

## **5. Common Vulnerabilities & Mitigations**

### **5.1 SQL Injection**

**Risk:** Malicious SQL in user input can compromise database.

**Mitigation:**
```typescript
// ❌ VULNERABLE - Never use string concatenation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;

// ✅ SAFE - Use parameterized queries (Prisma does this automatically)
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});

// ✅ SAFE - For raw queries, use parameters
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`;
```

### **5.2 NoSQL Injection**

**Risk:** Malicious objects in queries (MongoDB).

**Mitigation:**
```typescript
// ❌ VULNERABLE
const user = await User.findOne({ email: req.body.email });

// ✅ SAFE - Validate and sanitize input
const emailSchema = z.string().email();
const email = emailSchema.parse(req.body.email);
const user = await User.findOne({ email });
```

### **5.3 Cross-Site Scripting (XSS)**

**Risk:** Malicious scripts executed in user browsers.

**Mitigation:**
```typescript
// Backend: Sanitize HTML input
import DOMPurify from 'isomorphic-dompurify';

const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href']
  });
};

// Frontend: Always escape user-generated content
// React does this by default with JSX
<div>{userInput}</div> // ✅ Safe - React escapes by default
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // ❌ Dangerous
```

### **5.4 Cross-Site Request Forgery (CSRF)**

**Risk:** Unauthorized commands from trusted users.

**Mitigation:**
```typescript
import csrf from 'csurf';

// For session-based auth (cookies)
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// For JWT (token in header), CSRF is not a concern
// But validate Origin/Referer headers
app.use((req, res, next) => {
  const origin = req.get('origin');
  const referer = req.get('referer');
  
  if (req.method !== 'GET' && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid origin'
    });
  }
  
  next();
});
```

### **5.5 Mass Assignment**

**Risk:** Users modify fields they shouldn't have access to.

**Mitigation:**
```typescript
// ❌ VULNERABLE - Accepts any field from request
await prisma.user.update({
  where: { id: userId },
  data: req.body // User could set role: 'admin'
});

// ✅ SAFE - Whitelist allowed fields
const { name, email, phone } = req.body;
await prisma.user.update({
  where: { id: userId },
  data: { name, email, phone }
});

// ✅ SAFE - Use validation schema with strict mode
const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional()
}).strict(); // Rejects unknown fields
```

### **5.6 Insecure Direct Object References (IDOR)**

**Risk:** Users access resources by guessing IDs.

**Mitigation:**
```typescript
// ❌ VULNERABLE
app.get('/api/grades/:id', async (req, res) => {
  const grade = await prisma.grade.findUnique({
    where: { id: req.params.id }
  });
  res.json(grade); // Any user can access any grade
});

// ✅ SAFE - Verify ownership
app.get('/api/grades/:id', authenticate, async (req, res) => {
  const grade = await prisma.grade.findUnique({
    where: { id: req.params.id }
  });
  
  if (!grade) {
    return res.status(404).json({ message: 'Grade not found' });
  }
  
  // Check ownership
  if (req.user.role === 'student' && grade.studentId !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.json(grade);
});
```

### **5.7 Server-Side Request Forgery (SSRF)**

**Risk:** Attacker makes server send requests to internal services.

**Mitigation:**
```typescript
// ❌ VULNERABLE
app.post('/api/fetch-url', async (req, res) => {
  const response = await fetch(req.body.url);
  res.json(await response.json());
});

// ✅ SAFE - Validate and whitelist URLs
const allowedDomains = ['api.example.com', 'cdn.example.com'];

app.post('/api/fetch-url', async (req, res) => {
  const url = new URL(req.body.url);
  
  if (!allowedDomains.includes(url.hostname)) {
    return res.status(400).json({ message: 'Invalid URL domain' });
  }
  
  // Block internal IPs
  if (url.hostname === 'localhost' || url.hostname.startsWith('192.168.')) {
    return res.status(400).json({ message: 'Invalid URL' });
  }
  
  const response = await fetch(url.toString());
  res.json(await response.json());
});
```

---

## **6. Complete Security Checklist**

### **Authentication & Authorization**
- [ ] JWT tokens stored securely (httpOnly cookies or secure localStorage)
- [ ] Access tokens short-lived (15 minutes)
- [ ] Refresh tokens implemented and rotated
- [ ] Passwords hashed with bcrypt (cost factor ≥ 10)
- [ ] Password strength validation enforced
- [ ] Role-based access control on all routes
- [ ] Resource ownership verification
- [ ] Token blacklist for logout (optional but recommended)

### **Input Validation**
- [ ] All inputs validated with schemas (Zod)
- [ ] SQL/NoSQL injection prevented (parameterized queries)
- [ ] XSS prevention (sanitize HTML, escape output)
- [ ] Mass assignment prevented (whitelist fields)
- [ ] File upload validation (type, size, extension)
- [ ] Request size limits enforced

### **Network Security**
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Security headers set (Helmet)
- [ ] Rate limiting on sensitive endpoints
- [ ] CSRF protection (if using cookies)

### **Error Handling**
- [ ] Sensitive data not exposed in errors
- [ ] Generic error messages for authentication failures
- [ ] Proper error logging (without sensitive data)
- [ ] Stack traces hidden in production

### **Monitoring & Logging**
- [ ] All authentication attempts logged
- [ ] Failed login attempts monitored
- [ ] Suspicious activity alerts
- [ ] Audit logs for admin actions

---

**✅ Phase 7 Complete!** You now have comprehensive RBAC implementation with:
- Multi-layer security architecture
- Production-ready middleware
- Protected routes with examples
- Security best practices
- Common vulnerability mitigations
- Complete security checklist

**Next:** Phase 8 - Comprehensive QA & Testing Plan