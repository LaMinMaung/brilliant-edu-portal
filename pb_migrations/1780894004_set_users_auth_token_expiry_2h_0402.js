/// Set the users auth token expiry to 2 hours (7200 seconds).
/// Previously the default was 14 days (1209600 seconds).
/// The client-side session timeout (useSessionTimeout.ts) already enforces 2h of
/// inactivity, but this aligns the actual JWT expiry to match.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.authToken = { duration: 7200 }; // 2 hours
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.authToken = { duration: 1209600 }; // rollback to 14-day default
  app.save(users);
});
