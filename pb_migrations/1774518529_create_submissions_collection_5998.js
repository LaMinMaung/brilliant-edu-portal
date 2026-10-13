migrate((app) => {
  const usersId = app.findCollectionByNameOrId("users").id
  const assignmentsId = app.findCollectionByNameOrId("assignments").id
  
  const submissions = new Collection({
    name: "submissions",
    type: "base",
    listRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'teacher' || @request.auth.role = 'admin')",
    viewRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'teacher' || @request.auth.role = 'admin')",
    createRule: "@request.auth.role = 'student' && @request.body.student = @request.auth.id",
    updateRule: "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'teacher')",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "assignment", required: true, collectionId: assignmentsId, maxSelect: 1 },
      { type: "relation", name: "student", required: true, collectionId: usersId, maxSelect: 1 },
      { type: "file", name: "files", maxSelect: 5 },
      { type: "editor", name: "submittedText" },
      { type: "date", name: "submittedDate" },
      { type: "number", name: "score", min: 0 },
      { type: "editor", name: "feedback" },
      { type: "select", name: "status", required: true, values: ["submitted", "graded", "late"], maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(submissions)
}, (app) => {
  const submissions = app.findCollectionByNameOrId("submissions")
  app.delete(submissions)
})