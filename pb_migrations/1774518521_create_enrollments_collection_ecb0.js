migrate((app) => {
  const usersId = app.findCollectionByNameOrId("users").id
  const coursesId = app.findCollectionByNameOrId("courses").id
  
  const enrollments = new Collection({
    name: "enrollments",
    type: "base",
    listRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'teacher' || @request.auth.role = 'admin')",
    viewRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'teacher' || @request.auth.role = 'admin')",
    createRule: "@request.auth.role = 'student' && @request.body.student = @request.auth.id",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "student", required: true, collectionId: usersId, maxSelect: 1 },
      { type: "relation", name: "course", required: true, collectionId: coursesId, maxSelect: 1 },
      { type: "select", name: "status", required: true, values: ["pending", "enrolled", "dropped", "completed"], maxSelect: 1 },
      { type: "date", name: "enrolledDate" },
      { type: "date", name: "dropDate" },
      { type: "text", name: "finalGrade", max: 5 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(enrollments)
}, (app) => {
  const enrollments = app.findCollectionByNameOrId("enrollments")
  app.delete(enrollments)
})