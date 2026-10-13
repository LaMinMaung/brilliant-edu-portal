migrate((app) => {
  const usersId = app.findCollectionByNameOrId("users").id;

  // ── transfer_records (parent) ──────────────────────────────────
  // One record per student per institution.
  // Students may see their own; admins see all.
  const tr = new Collection({
    name: "transfer_records",
    type: "base",
    listRule:   "@request.auth.role = 'admin' || student = @request.auth.id",
    viewRule:   "@request.auth.role = 'admin' || student = @request.auth.id",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "student",     required: true,  collectionId: usersId, maxSelect: 1, cascadeDelete: false },
      { type: "text",     name: "institution", required: true,  max: 300 },
      { type: "select",   name: "status",      required: true,
        values: ["pending", "approved", "rejected"], maxSelect: 1 },
    ],
  });
  tr.fields.add(
    new AutodateField({ name: "created", onCreate: true }),
    new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
  );
  app.save(tr);

  // ── transfer_courses (child) ───────────────────────────────────
  // Many courses belong to one transfer_record.
  // cascadeDelete: true — deleting the parent removes all child courses.
  // Students may see courses belonging to their own records.
  const trId = app.findCollectionByNameOrId("transfer_records").id;
  const tc = new Collection({
    name: "transfer_courses",
    type: "base",
    listRule:   "@request.auth.role = 'admin' || transfer_record.student = @request.auth.id",
    viewRule:   "@request.auth.role = 'admin' || transfer_record.student = @request.auth.id",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "transfer_record", required: true,
        collectionId: trId, maxSelect: 1, cascadeDelete: true },
      { type: "text",   name: "course_name", required: true, max: 300 },
      { type: "number", name: "credits",     required: true, min: 0 },
    ],
  });
  tc.fields.add(
    new AutodateField({ name: "created", onCreate: true }),
    new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
  );
  app.save(tc);

}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("transfer_courses")); } catch (_) {}
  try { app.delete(app.findCollectionByNameOrId("transfer_records")); } catch (_) {}
});
