migrate((app) => {
  const s = app.settings()
  s.meta.appURL = "https://bei.brilliant-edu.org"
  app.save(s)
}, (app) => {
  const s = app.settings()
  s.meta.appURL = "https://brilliant-edu.org"
  app.save(s)
})