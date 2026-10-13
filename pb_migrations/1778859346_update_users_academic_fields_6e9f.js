migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const academicCoursesId = app.findCollectionByNameOrId("academic_courses").id;

  // Add dateOfBirth
  users.fields.add(new DateField({ name: "dateOfBirth" }));

  // Add assignedCourse relation
  users.fields.add(new RelationField({
    name: "assignedCourse",
    collectionId: academicCoursesId,
    maxSelect: 1,
    required: false
  }));

  // Extend status to include 'inactive'
  const statusField = users.fields.getByName("status");
  statusField.values = ["active", "inactive", "suspended", "graduated"];

  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("dateOfBirth");
  users.fields.removeByName("assignedCourse");
  const statusField = users.fields.getByName("status");
  statusField.values = ["active", "suspended", "graduated"];
  app.save(users);
});
