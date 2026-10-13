migrate((app) => {
  const courses = app.findCollectionByNameOrId("academic_courses");
  const creditsField = courses.fields.getByName("credits");
  creditsField.required = false;
  creditsField.min = 0;
  app.save(courses);
}, (app) => {
  // Not reverting — existing 0-credit courses would fail the min:1 constraint
});
