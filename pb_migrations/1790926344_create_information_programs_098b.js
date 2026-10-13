migrate((app) => {
  // Step 1: Add 'information_admin' to users.role select field
  const users = app.findCollectionByNameOrId("users");
  const roleField = users.fields.getByName("role");
  roleField.values = ["student", "teacher", "admin", "information_admin"];
  app.save(users);

  // Step 2: Create information_programs collection
  // This collection has NO relationships to applications, students, admissions, or any other collection.
  // It is purely for public informational content on the Programs page.
  const infoColl = new Collection({
    name: "information_programs",
    type: "base",
    listRule: "published = true || @request.auth.role = 'admin' || @request.auth.role = 'information_admin'",
    viewRule: "published = true || @request.auth.role = 'admin' || @request.auth.role = 'information_admin'",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'information_admin'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'information_admin'",
    deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'information_admin'",
    fields: [
      { type: "text",     name: "title",        required: true, max: 300 },
      { type: "select",   name: "category",      required: true, values: ["diploma", "undergraduate", "graduate", "online"], maxSelect: 1 },
      { type: "text",     name: "description",   required: true, max: 1000 },
      { type: "text",     name: "duration",      required: true, max: 50 },
      { type: "text",     name: "credits",       required: true, max: 50 },
      {
        type: "select", name: "tags",
        values: ["Full-Time","Part-Time","Flexible","English","Literature","Research","Programming","Web Dev","ICT","TESOL","Pedagogy","Teaching","Communication","Linguistics","Social Impact","Development","Leadership","Management","Foundation","Advanced","Coming Soon"],
        maxSelect: 10
      },
      { type: "file",     name: "image",         maxSelect: 1, mimeTypes: ["image/jpeg","image/png","image/webp"] },
      { type: "bool",     name: "comingSoon" },
      { type: "editor",   name: "fullContent" },
      { type: "text",     name: "applyFormLink", max: 1000 },
      { type: "bool",     name: "published" },
      { type: "autodate", name: "created",       onCreate: true },
      { type: "autodate", name: "updated",       onCreate: true, onUpdate: true },
    ],
  });
  app.save(infoColl);

  // Step 3: Seed content from existing programs records.
  // Text / select / bool fields are copied. File images cannot be copied in migrations
  // and must be re-uploaded via the admin portal. All seeded records are set to published = true.
  const existingPrograms = app.findRecordsByFilter("programs", "", "", 0, 0, {});
  const newColl = app.findCollectionByNameOrId("information_programs");
  for (const p of existingPrograms) {
    const nr = new Record(newColl);
    nr.set("title",        p.getString("title"));
    nr.set("category",     p.getString("category"));
    nr.set("description",  p.getString("description"));
    nr.set("duration",     p.getString("duration"));
    nr.set("credits",      p.getString("credits"));
    nr.set("tags",         p.get("tags") || []);
    nr.set("comingSoon",   p.getBool("comingSoon"));
    nr.set("fullContent",  p.getString("fullContent"));
    nr.set("applyFormLink", p.getString("applyFormLink"));
    nr.set("published",    true);
    app.save(nr);
  }
}, (app) => {
  // Rollback: delete information_programs and restore role values
  try {
    const c = app.findCollectionByNameOrId("information_programs");
    app.delete(c);
  } catch {}

  const users = app.findCollectionByNameOrId("users");
  const roleField = users.fields.getByName("role");
  roleField.values = ["student", "teacher", "admin"];
  app.save(users);
});
