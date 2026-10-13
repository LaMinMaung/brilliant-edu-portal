migrate((app) => {
  const gallery = new Collection({
    name: "gallery",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",   name: "title",        required: true, max: 200 },
      { type: "text",   name: "description",  max: 500 },
      { type: "file",   name: "image",        required: true, maxSelect: 1,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { type: "select", name: "status",       required: true,
        values: ["active", "inactive"], maxSelect: 1 },
      { type: "number", name: "displayOrder", min: 0 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true  },
    ],
  });
  app.save(gallery);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("gallery"));
})