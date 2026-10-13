migrate((app) => {
  const programs = new Collection({
    name: "programs",
    type: "base",
    listRule: "", // Public can view
    viewRule: "", // Public can view
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text", name: "title", required: true, max: 300 },
      { type: "select", name: "category", required: true, values: ["diploma", "undergraduate", "graduate", "online"], maxSelect: 1 },
      { type: "text", name: "description", required: true, max: 1000 },
      { type: "text", name: "duration", required: true, max: 50 },
      { type: "text", name: "credits", required: true, max: 50 },
      { type: "select", name: "tags", values: ["Full-Time", "Part-Time", "Flexible", "English", "Literature", "Research", "Programming", "Web Dev", "ICT", "TESOL", "Pedagogy", "Teaching", "Communication", "Linguistics", "Social Impact", "Development", "Leadership", "Management", "Foundation", "Advanced", "Coming Soon"], maxSelect: 10 },
      { type: "file", name: "image", maxSelect: 1, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { type: "bool", name: "comingSoon" },
      { type: "editor", name: "fullContent" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(programs)
  
  // Seed programs
  const programsData = [
    {
      title: "Bachelor of Arts in English",
      category: "undergraduate",
      description: "A comprehensive four-year undergraduate program developing advanced English language skills, literary analysis, and critical thinking for academic and professional success.",
      duration: "4 Years",
      credits: "120 Credits",
      tags: ["Full-Time", "English", "Literature", "Research"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>The Bachelor of Arts in English program provides a comprehensive education in English language, literature, linguistics, and writing. Students develop advanced critical thinking, analytical, and communication skills essential for careers in education, publishing, media, and international organizations.</p><h2>Learning Objectives</h2><ul><li>Master advanced English language skills (reading, writing, speaking, listening)</li><li>Analyze and interpret literary texts from diverse periods and cultures</li><li>Develop research and critical thinking abilities</li><li>Understand linguistic theory and language acquisition</li><li>Prepare for graduate study or professional careers in English-related fields</li></ul>"
    },
    {
      title: "Associate Degree in English Language Studies",
      category: "undergraduate",
      description: "A two-year program focusing on English language proficiency, linguistics, and communication — building a strong foundation for further undergraduate study or career entry.",
      duration: "2 Years",
      credits: "60 Credits",
      tags: ["Full-Time", "Linguistics", "Communication"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>This two-year associate degree provides a strong foundation in English language proficiency, communication skills, and linguistics. Perfect for students preparing to transfer to a four-year program or enter careers requiring strong English skills.</p>"
    },
    {
      title: "Associate Degree in English Language Teaching",
      category: "undergraduate",
      description: "Prepare to become an effective English language teacher with pedagogy, classroom management, and TESOL methodology courses over two years.",
      duration: "2 Years",
      credits: "60 Credits",
      tags: ["Full-Time", "TESOL", "Pedagogy", "Teaching"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>Designed for aspiring English teachers, this program covers modern TESOL methodologies, classroom management, lesson planning, and practical teaching experience.</p>"
    },
    {
      title: "Diploma in English",
      category: "diploma",
      description: "A focused program developing core English language skills — reading, writing, listening, and speaking — for academic progression and professional communication.",
      duration: "1 Year",
      credits: "30 Credits",
      tags: ["Flexible", "English", "Communication"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>Build essential English language skills in reading, writing, listening, and speaking. This one-year diploma prepares students for further academic study or professional roles requiring English proficiency.</p>"
    },
    {
      title: "Diploma in Teaching English",
      category: "diploma",
      description: "Learn practical teaching methodologies, lesson planning, and classroom strategies to teach English effectively in diverse educational settings.",
      duration: "1 Year",
      credits: "30 Credits",
      tags: ["Flexible", "TESOL", "Teaching"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>Gain practical skills to teach English as a second language. Covers lesson planning, classroom management, teaching techniques, and assessment strategies.</p>"
    },
    {
      title: "Diploma in Computer Science",
      category: "diploma",
      description: "Build foundational skills in programming (Python, JavaScript, Java), web development, databases, and problem-solving for technology careers.",
      duration: "1 Year",
      credits: "36 Credits",
      tags: ["Flexible", "Programming", "Web Dev", "ICT"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>Master programming fundamentals with Python, JavaScript, and Java. Learn web development, database design, and build a professional portfolio of projects.</p><h2>What You'll Learn</h2><ul><li>Python programming fundamentals</li><li>Web development (HTML, CSS, JavaScript, React)</li><li>Java programming</li><li>Database design and SQL</li><li>Version control with Git</li><li>Full-stack capstone project</li></ul>"
    },
    {
      title: "Diploma in Development Studies",
      category: "diploma",
      description: "Explore international development, sustainable practices, and community-driven approaches to social change. Launching soon — register your interest today.",
      duration: "1 Year",
      credits: "30 Credits",
      tags: ["Coming Soon", "Social Impact", "Development"],
      comingSoon: true,
      fullContent: "<h2>Program Overview</h2><p>Study international development theory and practice, sustainable development approaches, and community-based strategies for positive social change. Coming soon.</p>"
    },
    {
      title: "Diploma in Project Management",
      category: "diploma",
      description: "Master project planning, execution, and leadership skills. Learn industry-standard methodologies for managing projects in any sector.",
      duration: "1 Year",
      credits: "30 Credits",
      tags: ["Flexible", "Leadership", "Management"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>Learn to plan, execute, and deliver projects successfully using industry-standard methodologies including Agile, Waterfall, and hybrid approaches.</p>"
    },
    {
      title: "Diploma in English (Semester 1)",
      category: "diploma",
      description: "The first semester of the English diploma — covering foundational grammar, vocabulary, academic reading, and introductory writing skills.",
      duration: "6 Months",
      credits: "15 Credits",
      tags: ["Part-Time", "Foundation", "English"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>First semester of Diploma in English focusing on grammar fundamentals, vocabulary building, reading comprehension, and basic writing skills.</p>"
    },
    {
      title: "Diploma in English (Semester 2)",
      category: "diploma",
      description: "The advanced semester — building on Semester 1 with academic writing, presentation skills, critical analysis, and exam preparation.",
      duration: "6 Months",
      credits: "15 Credits",
      tags: ["Part-Time", "Advanced", "English"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>Advanced semester building on Semester 1 foundations with academic writing, presentation skills, critical reading, and exam preparation strategies.</p>"
    },
    {
      title: "Master of Arts in English (MA in English)",
      category: "graduate",
      description: "An advanced postgraduate program in English literature, applied linguistics, and research methodology — preparing graduates for academic careers and doctoral study.",
      duration: "2 Years",
      credits: "45 Credits",
      tags: ["Research", "Literature", "Linguistics"],
      comingSoon: false,
      fullContent: "<h2>Program Overview</h2><p>Advanced postgraduate study in English literature, applied linguistics, and research methodology. Prepares students for doctoral programs or academic teaching positions.</p><h2>Learning Objectives</h2><ul><li>Conduct independent literary and linguistic research</li><li>Master advanced critical theory and literary analysis</li><li>Develop expertise in specialized areas (postcolonial studies, linguistics)</li><li>Publish research in academic journals</li><li>Prepare for doctoral programs or academic teaching positions</li></ul>"
    }
  ]
  
  programsData.forEach((program) => {
    const record = new Record(programs)
    record.set("title", program.title)
    record.set("category", program.category)
    record.set("description", program.description)
    record.set("duration", program.duration)
    record.set("credits", program.credits)
    record.set("tags", program.tags)
    record.set("comingSoon", program.comingSoon)
    record.set("fullContent", program.fullContent)
    app.save(record)
  })
}, (app) => {
  const programs = app.findCollectionByNameOrId("programs")
  app.delete(programs)
})