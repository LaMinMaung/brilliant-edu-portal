migrate((app) => {
  const col = app.findCollectionByNameOrId("module_enrollments")
  const statusField = col.fields.getByName("status")
  statusField.values = ["pending", "active", "completed", "failed", "dropped"]
  app.save(col)
}, (app) => {
  const col = app.findCollectionByNameOrId("module_enrollments")
  const statusField = col.fields.getByName("status")
  statusField.values = ["active", "completed", "failed", "dropped"]
  app.db().newQuery('UPDATE module_enrollments SET status = "active" WHERE status = "pending"').execute()
  app.save(col)
})
