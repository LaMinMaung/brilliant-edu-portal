migrate((app) => {
	let settings = app.settings()
	settings.meta.appName = "Coderick AI"
	settings.meta.appURL = "https://vc501629289538.coderick.net"
	settings.meta.senderAddress = "admin@vc501629289538.coderick.net"

	settings.smtp.enabled = false
	settings.smtp.host = "localhost"
	settings.smtp.port = 465
	settings.smtp.username = ""
	settings.smtp.password = ""
	settings.smtp.tls = true

	app.save(settings)
})
