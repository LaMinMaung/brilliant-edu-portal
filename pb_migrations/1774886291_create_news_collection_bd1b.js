migrate((app) => {
  const news = new Collection({
    name: "news",
    type: "base",
    listRule: "", // Public can view
    viewRule: "", // Public can view
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { type: "text", name: "title", required: true, max: 300 },
      { type: "date", name: "date", required: true },
      { type: "select", name: "category", required: true, values: ["Partnership", "Programs", "Achievements", "Events", "Student Success", "Announcements"], maxSelect: 1 },
      { type: "text", name: "description", required: true, max: 500 },
      { type: "file", name: "image", maxSelect: 1, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { type: "editor", name: "fullContent", required: true },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  })
  
  app.save(news)
  
  // Seed initial news articles
  const articles = [
    {
      title: "BEI Announces Partnership with British Council EnglishScore",
      date: "2026-03-15",
      category: "Partnership",
      description: "Brilliant Educational Institute is proud to announce a new collaboration with the British Council EnglishScore certification program, providing students with internationally recognized English proficiency credentials.",
      fullContent: "<h2>Partnership Announcement</h2><p>Brilliant Educational Institute is proud to announce a new collaboration with the British Council EnglishScore certification program.</p><p>This partnership will provide our students with internationally recognized English proficiency credentials, opening doors to universities, scholarships, and career opportunities worldwide.</p><p><strong>Key Benefits:</strong></p><ul><li>Internationally recognized certification</li><li>Affordable testing fees</li><li>Online exam format</li><li>Results within 48 hours</li><li>Accepted by universities globally</li></ul><p>Students can now take the EnglishScore test as part of their BEI language program, with preparation courses and practice tests included.</p>"
    },
    {
      title: "New Diploma in Computer Science Program Launches",
      date: "2026-03-10",
      category: "Programs",
      description: "Our ICT department introduces a comprehensive Diploma in Computer Science covering HTML, CSS, JavaScript, Python, React, and Java. Enrollment now open for the upcoming semester.",
      fullContent: "<h2>Diploma in Computer Science - Now Enrolling</h2><p>The ICT Department is excited to announce the launch of our comprehensive Diploma in Computer Science program.</p><p><strong>Program Highlights:</strong></p><ul><li>Duration: 1 year (2 semesters)</li><li>36 credits</li><li>Industry-aligned curriculum</li><li>Portfolio-based assessment</li><li>Career guidance included</li></ul><p><strong>What You'll Learn:</strong></p><p>Semester 1: Python, HTML/CSS, Database fundamentals, Git version control, Problem solving & algorithms</p><p>Semester 2: JavaScript & React, Java programming, Data structures, Web design, Capstone project</p><p>Enrollment is now open for the Fall 2026 semester. Apply today!</p>"
    },
    {
      title: "500+ Students Enrolled: A Milestone for BEI",
      date: "2026-02-28",
      category: "Achievements",
      description: "BEI reaches a significant milestone with over 500 students enrolled across our four departments. Thank you to our students, faculty, and supporters for making this possible.",
      fullContent: "<h2>Celebrating 500+ Students</h2><p>We are thrilled to announce that Brilliant Educational Institute has reached a significant milestone - over 500 students enrolled across our four departments!</p><p>This achievement reflects our commitment to providing accessible, quality education to Myanmar students who have been displaced from traditional learning environments.</p><p><strong>Enrollment Breakdown:</strong></p><ul><li>Liberal Arts: 220 students</li><li>ICT & Technology: 180 students</li><li>Social Science: 65 students</li><li>Research & Development: 35 students</li></ul><p>Thank you to our dedicated faculty, supportive partners, and most importantly, our motivated students who make BEI's mission a reality every day.</p>"
    },
    {
      title: "Upcoming Webinar: University Pathways for Myanmar Students",
      date: "2026-02-20",
      category: "Events",
      description: "Join our free webinar on March 5th to learn about credit transfer opportunities, partner universities, and pathways from diploma to bachelor's degrees. Register now.",
      fullContent: "<h2>Free Webinar: University Pathways</h2><p><strong>Date:</strong> March 5, 2026<br><strong>Time:</strong> 7:00 PM Myanmar Time<br><strong>Platform:</strong> Zoom (link sent upon registration)</p><p><strong>What We'll Cover:</strong></p><ul><li>Credit transfer agreements with partner universities</li><li>Diploma to Bachelor's degree pathways</li><li>Scholarship opportunities for Myanmar students</li><li>Application process and requirements</li><li>Q&A session with admissions counselors</li></ul><p>This webinar is perfect for current diploma students planning to continue their education, as well as prospective students exploring higher education options.</p><p><strong>Registration:</strong> Email info@brilliant-edu.org with your name and current program.</p>"
    },
    {
      title: "IELTS Success Stories: Students Achieve Band 7+",
      date: "2026-02-12",
      category: "Student Success",
      description: "Congratulations to our IELTS preparation students who achieved Band 7 and above in the recent test cycle. Read their tips and experiences in our latest blog post.",
      fullContent: "<h2>IELTS Success Stories</h2><p>We are incredibly proud of our IELTS preparation students who achieved outstanding results in the February 2026 test cycle!</p><p><strong>Outstanding Performers:</strong></p><ul><li>Thida M. - Overall Band 8.0 (Listening 8.5, Reading 8.0, Writing 7.5, Speaking 8.0)</li><li>Kyaw Z. - Overall Band 7.5 (Listening 8.0, Reading 7.5, Writing 7.0, Speaking 7.5)</li><li>Su K. - Overall Band 7.0 (Listening 7.5, Reading 7.0, Writing 6.5, Speaking 7.0)</li></ul><p><strong>Their Study Tips:</strong></p><p>\"Practice every day, even if it's just 30 minutes. The BEI mock tests really helped me understand the exam format.\" - Thida M.</p><p>\"Don't neglect the Speaking section. Practice with classmates and record yourself.\" - Kyaw Z.</p><p>Join our next IELTS preparation course starting in April 2026!</p>"
    },
    {
      title: "GED Preparation Classes Now Open for Spring Enrollment",
      date: "2026-01-30",
      category: "Programs",
      description: "High school equivalency preparation courses starting in April. Our comprehensive GED program covers all four subjects with expert instructors and flexible online schedules.",
      fullContent: "<h2>GED Preparation Program</h2><p>BEI's GED Preparation program is designed to help Myanmar students earn their high school equivalency credential and pursue higher education opportunities.</p><p><strong>Program Details:</strong></p><ul><li>Duration: 12-16 weeks</li><li>All 4 subject areas covered (Math, Language Arts, Science, Social Studies)</li><li>Weekly mock exams</li><li>One-on-one tutoring available</li><li>Flexible online schedules</li><li>Study materials included</li></ul><p><strong>Spring 2026 Schedule:</strong></p><p>Start Date: April 1, 2026<br>Classes: Monday-Friday, 6:00-8:00 PM (Myanmar Time)<br>Live sessions + recorded lectures</p><p><strong>Investment:</strong> Contact admissions for current tuition rates and scholarship opportunities.</p><p>Apply now to secure your spot in the Spring cohort!</p>"
    },
    {
      title: "New Research Initiative: Digital Learning in Myanmar",
      date: "2026-01-15",
      category: "Announcements",
      description: "BEI's Research & Development department launches a study examining the effectiveness of online education for displaced students in Myanmar.",
      fullContent: "<h2>Research Initiative Launch</h2><p>The Research & Development department is launching a comprehensive study examining the effectiveness of online education for displaced students in Myanmar.</p><p>This 6-month research project will analyze learning outcomes, student engagement, and accessibility barriers to inform future program development.</p><p>Findings will be published in Q3 2026 and shared with partner institutions and education policymakers.</p>"
    },
    {
      title: "Alumni Spotlight: From BEI Diploma to University Success",
      date: "2025-12-20",
      category: "Student Success",
      description: "Meet Min K., who completed our Diploma in English and successfully transferred to a partner university in Thailand with full credit recognition.",
      fullContent: "<h2>Alumni Success Story</h2><p>Min K. graduated from BEI's Diploma in English program in 2025 and successfully transferred to Assumption University in Thailand.</p><p>\"BEI gave me the foundation I needed when formal education was no longer accessible in Myanmar. The diploma program prepared me academically and the credit transfer partnership made my university dream possible.\"</p><p>Min is now pursuing a BA in International Business and plans to return to Myanmar to support educational development.</p>"
    },
    {
      title: "Fall 2026 Enrollment Opens June 1st",
      date: "2025-12-01",
      category: "Announcements",
      description: "Early enrollment for Fall 2026 semester begins June 1st. Apply early for priority course selection and scholarship consideration.",
      fullContent: "<h2>Fall 2026 Enrollment</h2><p>Mark your calendars! Early enrollment for the Fall 2026 semester opens June 1st, 2026.</p><p><strong>Important Dates:</strong></p><ul><li>June 1: Early enrollment opens</li><li>July 15: Regular enrollment opens</li><li>August 20: Late enrollment deadline</li><li>September 1: Semester begins</li></ul><p>Apply early for priority course selection and scholarship consideration.</p>"
    },
    {
      title: "ICT Department Adds Python Data Science Course",
      date: "2025-11-18",
      category: "Programs",
      description: "New elective course covering NumPy, Pandas, Matplotlib, and machine learning basics. Available to diploma and undergraduate students.",
      fullContent: "<h2>New Course: Python for Data Science</h2><p>The ICT Department is expanding its curriculum with a new Python Data Science course covering data analysis, visualization, and machine learning fundamentals.</p><p><strong>Topics:</strong> NumPy arrays, Pandas dataframes, Matplotlib/Seaborn visualization, Scikit-learn basics, Real-world projects</p><p>Prerequisites: Completion of Introduction to Python or equivalent experience.</p>"
    },
    {
      title: "BEI Partners with Online University for Credit Transfer",
      date: "2025-11-05",
      category: "Partnership",
      description: "New partnership enables BEI diploma students to transfer up to 60 credits toward online bachelor's degrees in multiple disciplines.",
      fullContent: "<h2>Credit Transfer Partnership</h2><p>BEI has established a credit transfer agreement with an international online university, enabling diploma students to transfer up to 60 credits toward bachelor's degree programs.</p><p>This partnership opens pathways in Business, Computer Science, English, and Social Sciences.</p>"
    },
    {
      title: "Student Council Elections This Month",
      date: "2025-10-22",
      category: "Events",
      description: "Nominations open for BEI Student Council positions. Help shape the future of student programs and services at our institute.",
      fullContent: "<h2>Student Council Elections</h2><p>BEI is holding its first Student Council elections! Nominations are open for President, Vice President, and Department Representatives.</p><p>If you're passionate about student advocacy and want to help shape BEI's programs and services, consider running for a position.</p><p>Nomination deadline: November 5th. Elections: November 15th.</p>"
    },
    {
      title: "Library Access: Free Digital Resources Available",
      date: "2025-10-10",
      category: "Announcements",
      description: "BEI students now have free access to JSTOR, Project MUSE, and other academic databases through our institutional partnerships.",
      fullContent: "<h2>Digital Library Access</h2><p>All BEI students now have free access to leading academic databases including JSTOR, Project MUSE, and ERIC through our institutional partnerships.</p><p>Access credentials are available through the student portal. Contact the library team for research support and tutorials.</p>"
    },
    {
      title: "GED Pass Rate: 92% Success in Latest Cohort",
      date: "2025-09-28",
      category: "Achievements",
      description: "Our most recent GED cohort achieved a 92% pass rate across all four subject tests. Congratulations to all successful candidates!",
      fullContent: "<h2>GED Program Success</h2><p>We are proud to announce that our latest GED cohort achieved a 92% pass rate across all four subject tests - well above the national average!</p><p>This success is a testament to our dedicated instructors, comprehensive curriculum, and the hard work of our students.</p><p>Congratulations to all GED graduates!</p>"
    },
    {
      title: "Summer Language Intensive Programs Announced",
      date: "2025-09-15",
      category: "Programs",
      description: "Accelerated 6-week intensive programs in English, Burmese, and Japanese available this summer. Perfect for rapid skill development.",
      fullContent: "<h2>Summer Intensive Language Programs</h2><p>BEI is offering accelerated 6-week intensive language programs this summer in English, Burmese, and Japanese.</p><p><strong>Program Structure:</strong> 15 hours/week, Small class sizes (max 12 students), Live interactive sessions, Cultural immersion activities</p><p>Perfect for students who want to make rapid progress before the fall semester.</p>"
    }
  ]
  
  articles.forEach((article, index) => {
    const record = new Record(news)
    record.set("title", article.title)
    record.set("date", article.date)
    record.set("category", article.category)
    record.set("description", article.description)
    record.set("fullContent", article.fullContent)
    app.save(record)
  })
}, (app) => {
  const news = app.findCollectionByNameOrId("news")
  app.delete(news)
})