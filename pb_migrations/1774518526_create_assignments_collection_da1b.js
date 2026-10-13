migrate((app) => {
  const coursesId = app.findCollectionByNameOrId("courses").id
  
  const assignments = new Collection({
    name: "assignments",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'teacher' || @request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'teacher' || @request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "course", required: true, collectionId: coursesId, maxSelect: 1 },
      { type: "text", name: "title", required: true, max: 200 },
      { type: "editor", name: "description" },
      { type: "date", name: "dueDate", required: true },
      { type: "number", name: "maxScore", min: 1 },
      { type: "file", name: "attachments", maxSelect: 10 },
      { type: "select", name: "status", required: true, values: ["active", "closed"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(assignments)
}, (app) => {
  const assignments = app.findCollectionByNameOrId("assignments")
  app.delete(assignments)
})