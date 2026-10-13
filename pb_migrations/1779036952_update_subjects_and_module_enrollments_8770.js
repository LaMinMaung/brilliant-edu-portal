migrate((app) => {
  // 1. academic_subjects: remove maxMarks + passingMarks, add teacher_name + credit_no
  const subjects = app.findCollectionByNameOrId("academic_subjects");
  subjects.fields.removeByName("maxMarks");
  subjects.fields.removeByName("passingMarks");
  subjects.fields.add(new TextField({  name: "teacher_name", max: 200 }));
  subjects.fields.add(new NumberField({ name: "credit_no",   min: 0 }));
  app.save(subjects);

  // 2. module_enrollments: add selected_subjects JSON to track chosen subjects
  const enr = app.findCollectionByNameOrId("module_enrollments");
  enr.fields.add(new JSONField({ name: "selected_subjects" }));
  app.save(enr);
}, (app) => {
  try {
    const subjects = app.findCollectionByNameOrId("academic_subjects");
    subjects.fields.removeByName("teacher_name");
    subjects.fields.removeByName("credit_no");
    subjects.fields.add(new NumberField({ name: "maxMarks",     required: false, min: 1 }));
    subjects.fields.add(new NumberField({ name: "passingMarks", required: false, min: 0 }));
    app.save(subjects);
  } catch(_) {}
  try {
    const enr = app.findCollectionByNameOrId("module_enrollments");
    enr.fields.removeByName("selected_subjects");
    app.save(enr);
  } catch(_) {}
});
