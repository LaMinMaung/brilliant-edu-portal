migrate((app) => {
  const programsId = app.findCollectionByNameOrId("programs").id
  
  const applications = new Collection({
    name: "applications",
    type: "base",
    listRule: "@request.auth.role = 'admin'",
    viewRule: "@request.auth.role = 'admin'",
    createRule: "", // Public can submit applications
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "relation", name: "program", required: true, collectionId: programsId, maxSelect: 1 },
      { type: "text", name: "fullName", required: true, max: 200 },
      { type: "email", name: "email", required: true },
      { type: "text", name: "phone", required: true, max: 50 },
      { type: "date", name: "dateOfBirth", required: true },
      { type: "text", name: "address", required: true, max: 500 },
      { type: "json", name: "applicationData" },
      { type: "select", name: "status", required: true, values: ["pending", "reviewing", "accepted", "rejected"], maxSelect: 1 },
      { type: "editor", name: "adminNotes" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(applications)
}, (app) => {
  const applications = app.findCollectionByNameOrId("applications")
  app.delete(applications)
})