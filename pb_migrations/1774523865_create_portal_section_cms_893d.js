migrate((app) => {
  const portalSection = new Collection({
    name: "portal_section",
    type: "base",
    listRule: "", // Public can view
    viewRule: "", // Public can view
    createRule: "@request.auth.role = 'admin'", // Admin only
    updateRule: "@request.auth.role = 'admin'", // Admin only
    deleteRule: "@request.auth.role = 'admin'", // Admin only
    fields: [
      { type: "text", name: "title", required: true, max: 200 },
      { type: "editor", name: "description", required: true },
      { type: "text", name: "button_text", required: true, max: 50 },
      { type: "text", name: "button_link", required: true, max: 500 },
      { type: "text", name: "image_url", max: 1000 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(portalSection)
  
  // Create default portal section content
  const record = new Record(portalSection)
  record.set("title", "Access Your Student Portal")
  record.set("description", "<p>View your grades, submit assignments, manage enrollments, and access all your academic resources in one secure location.</p>")
  record.set("button_text", "Login to Portal")
  record.set("button_link", "/login")
  record.set("image_url", "/public_a9b9_84649cfa7e3c4016adc3a1ef0da3c19b.jpeg")
  app.save(record)
}, (app) => {
  const portalSection = app.findCollectionByNameOrId("portal_section")
  app.delete(portalSection)
})