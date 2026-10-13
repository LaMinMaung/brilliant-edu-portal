migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const degreesId = app.findCollectionByNameOrId("degrees").id;
  users.fields.add(new RelationField({ name: "assignedDegree", collectionId: degreesId, maxSelect: 1 }));
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("assignedDegree");
  app.save(users);
});
