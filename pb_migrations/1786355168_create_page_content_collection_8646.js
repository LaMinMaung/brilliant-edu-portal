migrate((app) => {
  const c = new Collection({
    name: "page_content",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text",   name: "page",            required: true, max: 100   },
      { type: "text",   name: "block_key",        required: true, max: 200   },
      { type: "select", name: "content_type",     values: ["text", "url", "image_url"], maxSelect: 1 },
      { type: "text",   name: "draft_value",      max: 20000 },
      { type: "text",   name: "published_value",  max: 20000 },
      { type: "autodate", name: "created", onCreate: true,  onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true,  onUpdate: true  },
    ],
  });
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("page_content");
  app.delete(c);
});
