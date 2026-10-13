migrate((app) => {
  const collaborators = new Collection({
    name: "collaborators",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",   name: "name",         required: true, max: 300 },
      { type: "file",   name: "logo",         required: true, maxSelect: 1, mimeTypes: ["image/jpeg","image/png","image/webp","image/gif","image/svg+xml"] },
      { type: "select", name: "status",       required: true, values: ["active","inactive"], maxSelect: 1 },
      { type: "number", name: "displayOrder", min: 0 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
  });
  app.save(collaborators);
}, (app) => {
  const c = app.findCollectionByNameOrId("collaborators");
  app.delete(c);
})
