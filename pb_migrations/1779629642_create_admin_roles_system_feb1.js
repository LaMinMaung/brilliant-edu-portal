migrate((app) => {
  const ALL_PERMS = [
    "dashboard","users","enrollments","departments","programs",
    "degrees","courses","grade_config","students","grades",
    "collaborators","settings","activity_logs","roles"
  ]

  // 1. Create admin_roles collection
  const adminRolesCol = new Collection({
    name: "admin_roles",
    type: "base",
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    fields: [
      { type: "text",  name: "name",        required: true, max: 100 },
      { type: "text",  name: "description", max: 500 },
      { type: "json",  name: "permissions" },
      { type: "bool",  name: "is_system" },
      { type: "text",  name: "color",       max: 30 },
      { type: "autodate", name: "created",  onCreate: true },
      { type: "autodate", name: "updated",  onCreate: true, onUpdate: true },
    ]
  })
  app.save(adminRolesCol)

  // 2. Add admin_role relation to users
  const usersCol = app.findCollectionByNameOrId("users")
  usersCol.fields.add(new RelationField({
    name: "admin_role",
    collectionId: adminRolesCol.id,
    maxSelect: 1,
  }))
  app.save(usersCol)

  // 3. Seed predefined roles
  const rolesData = [
    { name: "System Admin",      description: "Full access to all modules and system settings", permissions: ALL_PERMS, is_system: true,  color: "primary" },
    { name: "Enrollment Admin",  description: "Manage student enrollments and student accounts",  permissions: ["dashboard","enrollments","students"], is_system: false, color: "blue" },
    { name: "Academic Admin",    description: "Manage academic structure, courses and grades",   permissions: ["dashboard","departments","programs","degrees","courses","grade_config","grades"], is_system: false, color: "green" },
    { name: "Finance Admin",     description: "Access to financial dashboard and reports",        permissions: ["dashboard"], is_system: false, color: "yellow" },
    { name: "Staff Manager",     description: "Manage staff accounts and role assignments",       permissions: ["dashboard","users","roles"], is_system: false, color: "purple" },
  ]

  let systemAdminId = ""
  for (const rd of rolesData) {
    const rec = new Record(adminRolesCol)
    rec.set("name", rd.name)
    rec.set("description", rd.description)
    rec.set("permissions", rd.permissions)
    rec.set("is_system", rd.is_system)
    rec.set("color", rd.color)
    app.save(rec)
    if (rd.name === "System Admin") systemAdminId = rec.id
  }

  // 4. Assign System Admin role to all existing admin users
  if (systemAdminId) {
    const admins = app.findRecordsByFilter("users", 'role = "admin"', "", 0, 0, {})
    for (const admin of admins) {
      admin.set("admin_role", systemAdminId)
      app.save(admin)
    }
  }

}, (app) => {
  try {
    const usersCol = app.findCollectionByNameOrId("users")
    usersCol.fields.removeByName("admin_role")
    app.save(usersCol)
  } catch (_) {}
  try {
    app.delete(app.findCollectionByNameOrId("admin_roles"))
  } catch (_) {}
})
