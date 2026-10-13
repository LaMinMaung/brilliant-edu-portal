migrate((app) => {
  const usersId = app.findCollectionByNameOrId("users").id
  
  const courses = new Collection({
    name: "courses",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'teacher'",
    updateRule: "@request.auth.role = 'admin' || (teacher = @request.auth.id && @request.auth.role = 'teacher')",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text", name: "code", required: true, max: 20 },
      { type: "text", name: "title", required: true, max: 200 },
      { type: "editor", name: "description" },
      { type: "number", name: "credits", required: true, min: 1, max: 6 },
      { type: "relation", name: "teacher", required: true, collectionId: usersId, maxSelect: 1 },
      { type: "text", name: "semester", required: true, max: 50 },
      { type: "select", name: "status", required: true, values: ["active", "completed", "upcoming"], maxSelect: 1 },
      { type: "number", name: "maxStudents", min: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(courses)
}, (app) => {
  const courses = app.findCollectionByNameOrId("courses")
  app.delete(courses)
})