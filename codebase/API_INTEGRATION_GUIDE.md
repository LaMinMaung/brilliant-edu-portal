# 🔗 API Integration Guide: React Frontend ↔ Backend

Complete guide showing how to connect React frontend to both **PocketBase** (current implementation) and **Node.js/Express** (alternative backend).

---

## **Table of Contents**

1. [Current Architecture (PocketBase)](#1-current-architecture-pocketbase)
2. [Alternative Architecture (Node.js/Express)](#2-alternative-architecture-nodejsexpress)
3. [State Management Patterns](#3-state-management-patterns)
4. [Error Handling](#4-error-handling)
5. [Loading States](#5-loading-states)
6. [Real-time Updates](#6-real-time-updates)
7. [File Uploads](#7-file-uploads)
8. [Authentication Flow](#8-authentication-flow)

---

## **1. Current Architecture (PocketBase)**

### **Setup**

```typescript
// src/lib/pocketbase.js
import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

export default pb;
```

### **Example: Fetching Grades**

```typescript
// src/pages/portal/student/Grades.tsx
import React, { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";

const StudentGrades: React.FC = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const studentId = pb.authStore.record?.id;

        const gradesData = await pb.collection("grades").getFullList({
          filter: `student = "${studentId}"`,
          expand: "course,course.teacher",
          sort: "-created",
          requestKey: null, // Disable auto-cancellation
        });

        setGrades(gradesData);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching grades:", err);
        setError(err.message || "Failed to load grades");
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) return <p>Loading grades...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      {grades.length === 0 ? (
        <p>No grades found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr key={grade.id}>
                <td>{grade.expand?.course?.title}</td>
                <td>{grade.score}%</td>
                <td>{grade.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentGrades;
```

### **Key PocketBase Methods**

```typescript
// Fetch all records
const records = await pb.collection("grades").getFullList({
  filter: 'student = "xyz123"',
  expand: "course,teacher",
  sort: "-created",
  requestKey: null,
});

// Fetch paginated records
const result = await pb.collection("grades").getList(1, 20, {
  filter: 'status = "approved"',
  expand: "course",
});

// Fetch single record
const record = await pb.collection("grades").getOne("RECORD_ID", {
  expand: "course",
});

// Create record
const newRecord = await pb.collection("grades").create({
  student: studentId,
  course: courseId,
  score: 85,
  type: "midterm",
  status: "pending",
});

// Update record
const updated = await pb.collection("grades").update("RECORD_ID", {
  score: 90,
  status: "approved",
});

// Delete record
await pb.collection("grades").delete("RECORD_ID");
```

---

## **2. Alternative Architecture (Node.js/Express)**

### **Setup**

```bash
npm install axios
```

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### **Example: Fetching Grades with Express Backend**

```typescript
// src/pages/portal/student/Grades.tsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";

interface Grade {
  id: string;
  course: {
    code: string;
    title: string;
    instructor: string;
  };
  type: string;
  score: number;
  status: string;
  createdAt: string;
}

const StudentGrades: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);

        // GET /api/grades/student/:studentId
        const response = await api.get('/grades/student/me'); // 'me' resolves to current user
        
        setGrades(response.data.data.grades);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching grades:", err);
        setError(err.response?.data?.message || "Failed to load grades");
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) return <p>Loading grades...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      {grades.length === 0 ? (
        <p>No grades found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Instructor</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr key={grade.id}>
                <td>{grade.course.title}</td>
                <td>{grade.course.instructor}</td>
                <td>{grade.score}%</td>
                <td>{grade.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentGrades;
```

### **Express Backend API Example**

```typescript
// backend/src/controllers/grade.controller.ts
import { Request, Response } from 'express';
import prisma from '../config/database';

export const getStudentGrades = async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.id; // From JWT middleware

    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
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
```

---

## **3. State Management Patterns**

### **Basic State (useState)**

```typescript
const [data, setData] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### **Advanced State (useReducer)**

```typescript
import { useReducer } from 'react';

interface State {
  data: any[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: any[] }
  | { type: 'FETCH_ERROR'; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const MyComponent = () => {
  const [state, dispatch] = useReducer(reducer, {
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_START' });
      try {
        const result = await api.get('/grades');
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data.data.grades });
      } catch (err: any) {
        dispatch({ type: 'FETCH_ERROR', payload: err.message });
      }
    };

    fetchData();
  }, []);
};
```

### **Custom Hook (Reusable Data Fetching)**

```typescript
// src/hooks/useGrades.ts
import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';

export const useGrades = (studentId: string) => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const data = await pb.collection("grades").getFullList({
          filter: `student = "${studentId}"`,
          expand: "course",
          requestKey: null,
        });
        setGrades(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [studentId]);

  return { grades, loading, error };
};

// Usage
const MyComponent = () => {
  const { grades, loading, error } = useGrades(studentId);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  
  return <div>{/* Render grades */}</div>;
};
```

---

## **4. Error Handling**

### **PocketBase Error Handling**

```typescript
try {
  const result = await pb.collection("grades").create(data);
} catch (err: any) {
  if (err.status === 400) {
    console.error("Validation error:", err.data);
    alert("Invalid data: " + JSON.stringify(err.data));
  } else if (err.status === 403) {
    alert("Permission denied");
  } else if (err.status === 404) {
    alert("Record not found");
  } else {
    alert("An error occurred: " + err.message);
  }
}
```

### **Express/Axios Error Handling**

```typescript
try {
  const response = await api.post('/grades', gradeData);
} catch (err: any) {
  if (err.response) {
    // Server responded with error status
    console.error("Server error:", err.response.data);
    alert(err.response.data.message || "Server error");
  } else if (err.request) {
    // Request made but no response
    console.error("Network error:", err.request);
    alert("Network error. Please check your connection.");
  } else {
    // Something else happened
    console.error("Error:", err.message);
    alert("An unexpected error occurred");
  }
}
```

---

## **5. Loading States**

### **Skeleton Loader**

```typescript
const GradesPage = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-4 p-4 border rounded">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return <div>{/* Actual content */}</div>;
};
```

---

## **6. Real-time Updates**

### **PocketBase Realtime Subscriptions**

```typescript
useEffect(() => {
  const studentId = pb.authStore.record?.id;

  // Subscribe to grade changes
  const unsubscribe = pb.collection("grades").subscribe("*", (e) => {
    if (e.record.student === studentId) {
      if (e.action === "create") {
        setGrades((prev) => [e.record, ...prev]);
      } else if (e.action === "update") {
        setGrades((prev) =>
          prev.map((g) => (g.id === e.record.id ? e.record : g))
        );
      } else if (e.action === "delete") {
        setGrades((prev) => prev.filter((g) => g.id !== e.record.id));
      }
    }
  });

  return () => {
    unsubscribe.then((unsub) => unsub());
  };
}, []);
```

---

## **7. File Uploads**

### **PocketBase File Upload**

```typescript
const handleFileUpload = async (files: FileList) => {
  const formData = new FormData();
  formData.append("assignment", assignmentId);
  formData.append("student", studentId);

  // Append multiple files
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  try {
    const submission = await pb.collection("submissions").create(formData);
    console.log("Uploaded:", submission);
  } catch (err) {
    console.error("Upload failed:", err);
  }
};
```

### **Express File Upload (with Multer)**

```typescript
// Frontend
const handleFileUpload = async (files: FileList) => {
  const formData = new FormData();
  formData.append("assignmentId", assignmentId);

  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  try {
    const response = await api.post("/submissions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("Uploaded:", response.data);
  } catch (err) {
    console.error("Upload failed:", err);
  }
};

// Backend (Express + Multer)
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

router.post('/submissions', upload.array('files', 5), async (req, res) => {
  // req.files contains uploaded files
  // req.body contains form data
});
```

---

## **8. Authentication Flow**

### **PocketBase Auth**

```typescript
// Login
const login = async (email: string, password: string) => {
  try {
    const authData = await pb.collection("users").authWithPassword(email, password);
    // Token automatically stored in pb.authStore
    return authData.record;
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
};

// Logout
const logout = () => {
  pb.authStore.clear();
};

// Check if authenticated
const isAuthenticated = pb.authStore.isValid;
const currentUser = pb.authStore.record;
```

### **Express JWT Auth**

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data.data;
  
  // Store token
  localStorage.setItem('token', token);
  
  return user;
};

// Logout
const logout = () => {
  localStorage.removeItem('token');
};

// Check if authenticated
const isAuthenticated = !!localStorage.getItem('token');
```

---

## **Summary**

| Feature | PocketBase | Node.js/Express |
|---------|-----------|-----------------|
| **Setup Complexity** | Minimal | Moderate |
| **API Calls** | Built-in SDK | Axios/Fetch |
| **Authentication** | Built-in (JWT) | DIY (JWT + bcrypt) |
| **Real-time** | Built-in (SSE) | Socket.io/SSE |
| **File Uploads** | Built-in | Multer/S3 |
| **Flexibility** | Limited | Full control |

**Current Implementation:** PocketBase (90% less code, instant features)  
**Alternative:** Node.js/Express (full flexibility, better for scaling beyond 10K users)

Both architectures are production-ready and included in this project!