/// Security fix: prevent authenticated users from updating their own privileged fields.
///
/// BEFORE: "@request.auth.role = 'admin' || id = @request.auth.id"
///   → Any logged-in user (student/teacher) could send { "role": "admin" } and
///     promote themselves, or change assignedDegree/assignedCourse/studentId.
///
/// AFTER:  Admins retain full access. Self-updates are only allowed when the
///   request body does NOT contain any of the privileged fields.
///   Non-privileged fields (name, dateOfBirth, avatar, password, etc.) remain
///   self-updatable, preserving the student Profile page and password-change flows.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  users.updateRule =
    "@request.auth.role = 'admin' || " +
    "(" +
      "id = @request.auth.id && " +
      "@request.body.role:isset = false && " +
      "@request.body.status:isset = false && " +
      "@request.body.assignedDegree:isset = false && " +
      "@request.body.assignedCourse:isset = false && " +
      "@request.body.studentId:isset = false && " +
      "@request.body.admin_role:isset = false" +
    ")";

  app.save(users);
}, (app) => {
  // Rollback: restore the original (permissive) rule
  const users = app.findCollectionByNameOrId("users");
  users.updateRule = "@request.auth.role = 'admin' || id = @request.auth.id";
  app.save(users);
});
