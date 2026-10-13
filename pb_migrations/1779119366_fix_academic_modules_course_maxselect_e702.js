migrate((app) => {
  const col = app.findCollectionByNameOrId("academic_modules")
  const f = col.fields.getByName("course")
  f.maxSelect = 1
  app.save(col)
}, (app) => {
  const col = app.findCollectionByNameOrId("academic_modules")
  const f = col.fields.getByName("course")
  f.maxSelect = 999
  app.save(col)
})
