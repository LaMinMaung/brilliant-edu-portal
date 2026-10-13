migrate((app) => {
  const modules = app.findCollectionByNameOrId("academic_modules");
  modules.fields.removeByName("passingMarks");
  app.save(modules);
}, (app) => {
  const modules = app.findCollectionByNameOrId("academic_modules");
  modules.fields.add(new NumberField({ name: "passingMarks", required: false, min: 0 }));
  app.save(modules);
});
