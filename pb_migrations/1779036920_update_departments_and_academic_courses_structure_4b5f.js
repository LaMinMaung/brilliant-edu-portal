migrate((app) => {
  // 1. Remove degree relation from departments (dept now connects via Program)
  const depts = app.findCollectionByNameOrId("departments");
  depts.fields.removeByName("degree");
  app.save(depts);

  // 2. Update academic_courses: remove department, add degree + new fields
  const courses = app.findCollectionByNameOrId("academic_courses");
  const degsId  = app.findCollectionByNameOrId("degrees").id;

  courses.fields.removeByName("department");
  courses.fields.add(new RelationField({ name: "degree",        collectionId: degsId, maxSelect: 1, required: false }));
  courses.fields.add(new TextField({     name: "academic_year", max: 20 }));
  courses.fields.add(new NumberField({   name: "year_level",   min: 1 }));
  courses.fields.add(new NumberField({   name: "module_no",    min: 0 }));

  // Add 'completed' to course status
  const sf = courses.fields.getByName("status");
  sf.values = ["active", "inactive", "completed"];
  app.save(courses);
}, (app) => {
  try {
    const depts  = app.findCollectionByNameOrId("departments");
    const degsId = app.findCollectionByNameOrId("degrees").id;
    depts.fields.add(new RelationField({ name: "degree", required: false, collectionId: degsId, maxSelect: 1 }));
    app.save(depts);
  } catch(_) {}
  try {
    const courses = app.findCollectionByNameOrId("academic_courses");
    courses.fields.removeByName("degree");
    courses.fields.removeByName("academic_year");
    courses.fields.removeByName("year_level");
    courses.fields.removeByName("module_no");
    const depsId = app.findCollectionByNameOrId("departments").id;
    courses.fields.add(new RelationField({ name: "department", required: false, collectionId: depsId, maxSelect: 1 }));
    const sf = courses.fields.getByName("status");
    sf.values = ["active", "inactive"];
    app.save(courses);
  } catch(_) {}
});
