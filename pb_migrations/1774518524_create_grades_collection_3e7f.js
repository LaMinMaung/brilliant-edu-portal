migrate((app) => {
  const usersId = app.findCollectionByNameOrId("users").id
  const coursesId = app.findCollectionByNameOrId("courses").id
  
  const grades = new Collection({
    name: "grades",
    type: "base",
    listRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'teacher' || @request.auth.role = 'admin')",
    viewRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'teacher' || @request.auth.role = 'admin')",
    createRule: "@request.auth.role = 'teacher' || @request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'teacher' || @request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "student", required: true, collectionId: usersId, maxSelect: 1 },
      { type: "relation", name: "course", required: true, collectionId: coursesId, maxSelect: 1 },
      { type: "select", name: "type", required: true, values: ["midterm", "final", "assignment", "quiz"], maxSelect: 1 },
      { type: "number", name: "score", required: true, min: 0, max: 100 },
      { type: "number", name: "maxScore", min: 1 },
      { type: "select", name: "status", required: true, values: ["pending", "approved", "rejected"], maxSelect: 1 },
      { type: "editor", name: "remarks" },
      { type: "relation", name: "gradedBy", collectionId: usersId, maxSelect: 1 },
      { type: "date", name: "gradedDate" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(grades)
}, (app) => {
  const grades = app.findCollectionByNameOrId("grades")
  app.delete(grades)
})