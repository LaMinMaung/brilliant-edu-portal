migrate((app) => {
  const usersId = app.findCollectionByNameOrId("users").id;

  const resources = new Collection({
    name: "resources",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",   name: "title",       required: true, max: 300 },
      { type: "text",   name: "description", max: 2000 },
      { type: "file",   name: "file",        required: true, maxSelect: 1, maxSize: 52428800 },
      { type: "text",   name: "file_name",   max: 500 },
      { type: "text",   name: "file_type",   max: 150 },
      { type: "number", name: "file_size" },
      { type: "relation", name: "uploaded_by", collectionId: usersId, maxSelect: 1, cascadeDelete: false },
    ],
  });

  resources.fields.add(
    new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
    new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
  );

  app.save(resources);
}, (app) => {
  const c = app.findCollectionByNameOrId("resources");
  app.delete(c);
});
