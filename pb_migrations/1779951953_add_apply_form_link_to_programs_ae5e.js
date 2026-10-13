migrate((app) => {
  const programs = app.findCollectionByNameOrId("programs")
  programs.fields.add(new TextField({ name: "applyFormLink", max: 1000 }))
  app.save(programs)
}, (app) => {
  const programs = app.findCollectionByNameOrId("programs")
  programs.fields.removeByName("applyFormLink")
  app.save(programs)
})
