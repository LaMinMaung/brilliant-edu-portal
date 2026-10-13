migrate((app) => {
  const bulletins = new Collection({
    name: "bulletins",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",   name: "title",        required: true,  max: 300  },
      { type: "text",   name: "description",  required: true,  max: 1000 },
      { type: "url",    name: "url",          required: true              },
      { type: "number", name: "displayOrder"                              },
      { type: "bool",   name: "is_active"                                 },
      { type: "autodate", name: "created", onCreate: true,  onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true,  onUpdate: true  },
    ],
  });
  app.save(bulletins);
}, (app) => {
  const bulletins = app.findCollectionByNameOrId("bulletins");
  app.delete(bulletins);
});
