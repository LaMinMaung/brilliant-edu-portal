migrate((app) => {
  const modules = app.findCollectionByNameOrId("academic_modules");

  // Update status values (make not-required temporarily so old records are valid during save)
  const sf = modules.fields.getByName("status");
  sf.values   = ["upcoming", "ongoing", "finish", "graded"];
  sf.required = false;

  // Add enrollment duration + subject count fields
  modules.fields.add(new DateField({   name: "start_date" }));
  modules.fields.add(new DateField({   name: "end_date" }));
  modules.fields.add(new DateField({   name: "actual_end_date" }));
  modules.fields.add(new NumberField({ name: "subject_no", min: 0 }));

  app.save(modules);

  // Migrate old status values via raw SQL (bypasses select validation)
  app.db().newQuery(
    "UPDATE academic_modules SET status = 'upcoming' WHERE status IN ('active','inactive') OR status = ''"
  ).execute();

  // Re-enable required
  const m2 = app.findCollectionByNameOrId("academic_modules");
  m2.fields.getByName("status").required = true;
  app.save(m2);
}, (app) => {
  const modules = app.findCollectionByNameOrId("academic_modules");
  modules.fields.removeByName("start_date");
  modules.fields.removeByName("end_date");
  modules.fields.removeByName("actual_end_date");
  modules.fields.removeByName("subject_no");
  const sf = modules.fields.getByName("status");
  sf.values   = ["active", "inactive"];
  sf.required = true;
  app.save(modules);
  app.db().newQuery("UPDATE academic_modules SET status = 'active'").execute();
});
