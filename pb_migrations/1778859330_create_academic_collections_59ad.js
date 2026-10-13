migrate((app) => {
  // 1. Degrees
  const degrees = new Collection({
    name: "degrees",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",   name: "degreeCode", required: true, max: 20 },
      { type: "text",   name: "degreeName", required: true, max: 200 },
      { type: "number", name: "durationYears", required: true, min: 1, max: 10 },
      { type: "select", name: "status", required: true, values: ["active","inactive"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });
  app.save(degrees);

  // 2. Departments
  const degreesId = app.findCollectionByNameOrId("degrees").id;
  const departments = new Collection({
    name: "departments",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",     name: "departmentCode", required: true, max: 20 },
      { type: "text",     name: "departmentName", required: true, max: 200 },
      { type: "relation", name: "degree", required: true, collectionId: degreesId, maxSelect: 1 },
      { type: "select",   name: "status", required: true, values: ["active","inactive"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });
  app.save(departments);

  // 3. Academic Courses
  const departmentsId = app.findCollectionByNameOrId("departments").id;
  const academic_courses = new Collection({
    name: "academic_courses",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",     name: "courseCode", required: true, max: 20 },
      { type: "text",     name: "courseName", required: true, max: 200 },
      { type: "relation", name: "department", required: true, collectionId: departmentsId, maxSelect: 1 },
      { type: "number",   name: "credits", required: true, min: 1 },
      { type: "select",   name: "status", required: true, values: ["active","inactive"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });
  app.save(academic_courses);

  // 4. Academic Modules
  const academicCoursesId = app.findCollectionByNameOrId("academic_courses").id;
  const academic_modules = new Collection({
    name: "academic_modules",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",     name: "moduleName", required: true, max: 200 },
      { type: "number",   name: "moduleOrder", required: true, min: 1 },
      { type: "relation", name: "course", required: true, collectionId: academicCoursesId, maxSelect: 1 },
      { type: "text",     name: "description", max: 1000 },
      { type: "number",   name: "passingMarks", required: true, min: 0 },
      { type: "select",   name: "status", required: true, values: ["active","inactive"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });
  app.save(academic_modules);

  // 5. Academic Subjects
  const academicModulesId = app.findCollectionByNameOrId("academic_modules").id;
  const academic_subjects = new Collection({
    name: "academic_subjects",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",     name: "subjectCode", required: true, max: 20 },
      { type: "text",     name: "subjectName", required: true, max: 200 },
      { type: "relation", name: "module", required: true, collectionId: academicModulesId, maxSelect: 1 },
      { type: "select",   name: "subjectType", required: true, values: ["mandatory","optional"], maxSelect: 1 },
      { type: "number",   name: "maxMarks", required: true, min: 1 },
      { type: "number",   name: "passingMarks", required: true, min: 0 },
      { type: "select",   name: "status", required: true, values: ["active","inactive"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });
  app.save(academic_subjects);

  // 6. Grade Configs
  const grade_configs = new Collection({
    name: "grade_configs",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "number", name: "minMarks",   required: true, min: 0 },
      { type: "number", name: "maxMarks",   required: true, min: 0 },
      { type: "text",   name: "gradeLabel", required: true, max: 5 },
      { type: "number", name: "gradePoint", required: true, min: 0 },
      { type: "text",   name: "remarks",    max: 200 },
      { type: "autodate", name: "created",  onCreate: true },
      { type: "autodate", name: "updated",  onCreate: true, onUpdate: true }
    ]
  });
  app.save(grade_configs);

  // 7. Module Enrollments
  const usersId = app.findCollectionByNameOrId("users").id;
  const module_enrollments = new Collection({
    name: "module_enrollments",
    type: "base",
    listRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'admin')",
    viewRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'admin')",
    createRule: "@request.auth.role = 'admin' || (@request.auth.role = 'student' && @request.body.student = @request.auth.id)",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "student", required: true, collectionId: usersId,            maxSelect: 1 },
      { type: "relation", name: "module",  required: true, collectionId: academicModulesId,  maxSelect: 1 },
      { type: "relation", name: "course",  required: true, collectionId: academicCoursesId,  maxSelect: 1 },
      { type: "select",   name: "status",  required: true, values: ["active","completed","failed","dropped"], maxSelect: 1 },
      { type: "date",     name: "enrolledDate" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });
  app.save(module_enrollments);

  // 8. Grade Records
  const moduleEnrollmentsId = app.findCollectionByNameOrId("module_enrollments").id;
  const academicSubjectsId  = app.findCollectionByNameOrId("academic_subjects").id;
  const grade_records = new Collection({
    name: "grade_records",
    type: "base",
    listRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'admin')",
    viewRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'admin')",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "student",    required: true, collectionId: usersId,              maxSelect: 1 },
      { type: "relation", name: "enrollment", required: true, collectionId: moduleEnrollmentsId,  maxSelect: 1 },
      { type: "relation", name: "course",     required: true, collectionId: academicCoursesId,    maxSelect: 1 },
      { type: "relation", name: "module",     required: true, collectionId: academicModulesId,    maxSelect: 1 },
      { type: "relation", name: "subject",    required: true, collectionId: academicSubjectsId,   maxSelect: 1 },
      { type: "number",   name: "marksObtained", required: true, min: 0 },
      { type: "number",   name: "maxMarks",       required: true, min: 1 },
      { type: "text",     name: "gradeLabel",  max: 5 },
      { type: "number",   name: "gradePoint",  min: 0 },
      { type: "text",     name: "remarks",     max: 500 },
      { type: "select",   name: "gradingStatus", required: true, values: ["draft","published","locked"], maxSelect: 1 },
      { type: "relation", name: "gradedBy",    collectionId: usersId, maxSelect: 1 },
      { type: "autodate", name: "created",     onCreate: true },
      { type: "autodate", name: "updated",     onCreate: true, onUpdate: true }
    ]
  });
  app.save(grade_records);

}, (app) => {
  for (const name of ["grade_records","module_enrollments","grade_configs","academic_subjects","academic_modules","academic_courses","departments","degrees"]) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch(_) {}
  }
});
