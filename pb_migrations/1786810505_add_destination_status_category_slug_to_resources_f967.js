migrate((app) => {
  const resources = app.findCollectionByNameOrId("resources");

  // Add new fields to existing collection
  resources.fields.add(
    new SelectField({
      name: "destination",
      values: ["student_portal", "website", "both"],
      maxSelect: 1,
      required: false,
    }),
    new SelectField({
      name: "status",
      values: ["draft", "published"],
      maxSelect: 1,
      required: false,
    }),
    new TextField({ name: "category", max: 100 }),
    new TextField({ name: "slug",     max: 200 })
  );

  // Update rules:
  //   - Authenticated users see all resources (student portal).
  //   - Unauthenticated users can ONLY see published website resources.
  resources.listRule = "@request.auth.id != '' || ((destination = 'website' || destination = 'both') && status = 'published')";
  resources.viewRule = "@request.auth.id != '' || ((destination = 'website' || destination = 'both') && status = 'published')";

  app.save(resources);

  // Backfill existing records so they remain in the student portal
  try {
    const existing = app.findRecordsByFilter("resources", "id != ''", "", 0, 0, {});
    for (const r of existing) {
      if (!r.getString("destination")) {
        r.set("destination", "student_portal");
        r.set("status",      "published");
        app.save(r);
      }
    }
  } catch (e) {
    // No existing records — nothing to backfill
  }
}, (app) => {
  const resources = app.findCollectionByNameOrId("resources");

  resources.fields.removeByName("destination");
  resources.fields.removeByName("status");
  resources.fields.removeByName("category");
  resources.fields.removeByName("slug");

  resources.listRule = "@request.auth.id != ''";
  resources.viewRule = "@request.auth.id != ''";

  app.save(resources);
});
