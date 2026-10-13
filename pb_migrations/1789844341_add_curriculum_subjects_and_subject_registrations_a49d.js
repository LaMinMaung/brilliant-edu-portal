migrate((app) => {
  const subjectsId = app.findCollectionByNameOrId("academic_subjects").id;
  const degreesId  = app.findCollectionByNameOrId("degrees").id;
  const usersId    = app.findCollectionByNameOrId("users").id;

  // curriculum_subjects: canonical placement of a subject within a degree's curriculum
  // One subject (e.g. Java101) can appear in multiple degrees with different classifications
  const cs = new Collection({
    name:       "curriculum_subjects",
    type:       "base",
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  });
  cs.fields.add(
    new RelationField({ name: "subject",        required: true,  collectionId: subjectsId, maxSelect: 1 }),
    new RelationField({ name: "degree",         required: true,  collectionId: degreesId,  maxSelect: 1 }),
    new TextField({    name: "module_label",    required: true,  max: 200 }),
    new SelectField({  name: "classification",  required: true,  values: ["mandatory", "elective"], maxSelect: 1 }),
    new SelectField({  name: "status",          required: true,  values: ["active", "inactive"],    maxSelect: 1 }),
    new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
    new AutodateField({ name: "updated", onCreate: true, onUpdate: true  })
  );
  app.save(cs);

  // subject_registrations: individual student registration for a curriculum-placed subject
  // Completely separate from module_enrollments — does NOT affect degree progression
  const csId = app.findCollectionByNameOrId("curriculum_subjects").id;
  const sr = new Collection({
    name:       "subject_registrations",
    type:       "base",
    listRule:   "student = @request.auth.id || @request.auth.role = 'admin'",
    viewRule:   "student = @request.auth.id || @request.auth.role = 'admin'",
    createRule: "@request.auth.role = 'student' && @request.body.student = @request.auth.id && @request.body.status = 'pending'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  });
  sr.fields.add(
    new RelationField({ name: "student",            required: true,  collectionId: usersId,    maxSelect: 1 }),
    new RelationField({ name: "curriculum_subject", required: true,  collectionId: csId,       maxSelect: 1 }),
    new RelationField({ name: "subject",            required: true,  collectionId: subjectsId, maxSelect: 1 }),
    new SelectField({  name: "status",              required: true,
      values: ["pending", "active", "passed", "failed", "withdrawn", "dropped"], maxSelect: 1 }),
    new RelationField({ name: "approved_by",        required: false, collectionId: usersId,    maxSelect: 1 }),
    new TextField({    name: "notes",               max: 1000 }),
    new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
    new AutodateField({ name: "updated", onCreate: true, onUpdate: true  })
  );
  app.save(sr);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("subject_registrations")); } catch (_) {}
  try { app.delete(app.findCollectionByNameOrId("curriculum_subjects"));   } catch (_) {}
});
