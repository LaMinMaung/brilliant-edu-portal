migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  // Allow admins to list/view all users; regular users only see themselves
  users.listRule   = "@request.auth.role = 'admin' || id = @request.auth.id";
  users.viewRule   = "@request.auth.role = 'admin' || id = @request.auth.id";
  users.updateRule = "@request.auth.role = 'admin' || id = @request.auth.id";
  users.deleteRule = "@request.auth.role = 'admin'";

  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.listRule   = "id = @request.auth.id";
  users.viewRule   = "id = @request.auth.id";
  users.updateRule = "id = @request.auth.id";
  users.deleteRule = "id = @request.auth.id";
  app.save(users);
});
