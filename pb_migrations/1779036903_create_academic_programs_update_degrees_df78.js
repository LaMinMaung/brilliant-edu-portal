migrate((app) => {
  // 1. Create academic_programs
  const depsId = app.findCollectionByNameOrId("departments").id;
  const prog = new Collection({
    name: "academic_programs",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",     name: "title",       required: true, max: 300 },
      { type: "text",     name: "short_name",  required: true, max: 50 },
      { type: "relation", name: "department",  required: true, collectionId: depsId, maxSelect: 1 },
      { type: "text",     name: "description", max: 2000 },
      { type: "select",   name: "status", required: true, values: ["active","inactive"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });
  app.save(prog);

  // 2. Update degrees: add program relation, batch_no, academic_year
  const degs = app.findCollectionByNameOrId("degrees");
  const progId = app.findCollectionByNameOrId("academic_programs").id;
  degs.fields.add(new RelationField({ name: "program", collectionId: progId, maxSelect: 1, required: false }));
  degs.fields.add(new TextField({ name: "batch_no",      max: 100 }));
  degs.fields.add(new TextField({ name: "academic_year", max: 20 }));
  app.save(degs);
}, (app) => {
  try {
    const degs = app.findCollectionByNameOrId("degrees");
    degs.fields.removeByName("program");
    degs.fields.removeByName("batch_no");
    degs.fields.removeByName("academic_year");
    app.save(degs);
  } catch(_) {}
  try { app.delete(app.findCollectionByNameOrId("academic_programs")); } catch(_) {}
});
