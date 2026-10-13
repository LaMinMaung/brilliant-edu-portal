migrate((app) => {
  // --- archived_students ---
  const archivedStudents = new Collection({
    name: "archived_students",
    type: "base",
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text",   name: "original_id",          max: 50 },
      { type: "text",   name: "student_name",          max: 255 },
      { type: "text",   name: "student_email",         max: 255 },
      { type: "text",   name: "studentId",             max: 50 },
      { type: "text",   name: "assigned_course_name",  max: 200 },
      { type: "text",   name: "archived_by_name",      max: 200 },
      { type: "json",   name: "original_data" },
      { type: "autodate", name: "created", onCreate: true },
    ]
  })
  app.save(archivedStudents)

  // --- archived_enrollments ---
  const archivedEnrollments = new Collection({
    name: "archived_enrollments",
    type: "base",
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text",   name: "original_id",    max: 50 },
      { type: "text",   name: "student_id",     max: 50 },
      { type: "text",   name: "student_name",   max: 255 },
      { type: "text",   name: "module_name",    max: 200 },
      { type: "text",   name: "course_name",    max: 200 },
      { type: "text",   name: "status",         max: 50 },
      { type: "json",   name: "selected_subjects" },
      { type: "json",   name: "original_data" },
      { type: "autodate", name: "created", onCreate: true },
    ]
  })
  app.save(archivedEnrollments)

  // --- archived_grade_records ---
  const archivedGradeRecords = new Collection({
    name: "archived_grade_records",
    type: "base",
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text",   name: "original_id",    max: 50 },
      { type: "text",   name: "student_id",     max: 50 },
      { type: "text",   name: "student_name",   max: 255 },
      { type: "text",   name: "subject_name",   max: 200 },
      { type: "text",   name: "module_name",    max: 200 },
      { type: "number", name: "marksObtained" },
      { type: "number", name: "maxMarks" },
      { type: "text",   name: "gradeLabel",     max: 10 },
      { type: "number", name: "gradePoint" },
      { type: "text",   name: "gradingStatus",  max: 50 },
      { type: "json",   name: "original_data" },
      { type: "autodate", name: "created", onCreate: true },
    ]
  })
  app.save(archivedGradeRecords)

  // --- activity_logs ---
  const activityLogs = new Collection({
    name: "activity_logs",
    type: "base",
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "user_id",   max: 50 },
      { type: "text", name: "user_name", max: 255 },
      { type: "text", name: "role",      max: 50 },
      { type: "text", name: "action",    max: 200 },
      { type: "text", name: "details",   max: 2000 },
      { type: "text", name: "device",    max: 1000 },
      { type: "autodate", name: "created", onCreate: true },
    ]
  })
  app.save(activityLogs)

}, (app) => {
  for (const name of ["archived_students","archived_enrollments","archived_grade_records","activity_logs"]) {
    try { app.delete(app.findCollectionByNameOrId(name)) } catch (_) {}
  }
})
