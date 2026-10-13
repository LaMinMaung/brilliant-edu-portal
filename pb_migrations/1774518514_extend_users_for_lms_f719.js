migrate((app) => {
  const users = app.findCollectionByNameOrId("users")
  
  // Add LMS-specific fields to users collection
  users.fields.add(
    new SelectField({
      name: "role",
      required: true,
      values: ["student", "teacher", "admin"],
      maxSelect: 1
    })
  )
  
  users.fields.add(
    new TextField({
      name: "studentId",
      max: 50
    })
  )
  
  users.fields.add(
    new SelectField({
      name: "status",
      required: true,
      values: ["active", "suspended", "graduated"],
      maxSelect: 1
    })
  )
  
  // Update default to active
  users.fields.getByName("status").required = false
  
  app.save(users)
}, (app) => {
  const users = app.findCollectionByNameOrId("users")
  users.fields.removeByName("role")
  users.fields.removeByName("studentId")
  users.fields.removeByName("status")
  app.save(users)
})