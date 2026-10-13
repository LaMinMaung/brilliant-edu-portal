migrate((app) => {
  const gradeRecords = app.findCollectionByNameOrId("grade_records");
  const srId         = app.findCollectionByNameOrId("subject_registrations").id;

  // Make enrollment optional so elective students (who have no module_enrollment)
  // can still have grade records. All existing records already have enrollment set.
  const enrollmentField = gradeRecords.fields.getByName("enrollment");
  enrollmentField.required = false;

  // Add optional subject_registration back-reference for elective grade records
  gradeRecords.fields.add(
    new RelationField({ name: "subject_registration", required: false, collectionId: srId, maxSelect: 1 })
  );

  app.save(gradeRecords);
}, (app) => {
  const gradeRecords = app.findCollectionByNameOrId("grade_records");

  // Restore enrollment as required
  const enrollmentField = gradeRecords.fields.getByName("enrollment");
  enrollmentField.required = true;

  // Remove subject_registration field
  gradeRecords.fields.removeByName("subject_registration");

  app.save(gradeRecords);
});
