migrate((app) => {
  const applications = app.findCollectionByNameOrId("applications");
  applications.createRule =
    "@request.body.status = 'pending' && @request.body.adminNotes:isset = false";
  app.save(applications);
}, (app) => {
  const applications = app.findCollectionByNameOrId("applications");
  applications.createRule = "";
  app.save(applications);
});
