/// Adds a SQLite AFTER UPDATE trigger on `academic_modules`.
/// Whenever a module's `status` column transitions to 'graded' the trigger
/// immediately sets every linked module_enrollment record (for that module)
/// to status = 'completed', skipping rows that are already in a terminal
/// state ('completed', 'dropped', 'failed').
///
/// Runs within the same DB transaction as the module update, so no separate
/// request or background job is needed.

migrate((app) => {
  app.db().newQuery(`
    CREATE TRIGGER IF NOT EXISTS trg_complete_enrollments_on_module_graded
    AFTER UPDATE OF status ON academic_modules
    WHEN NEW.status = 'graded' AND OLD.status != 'graded'
    BEGIN
      UPDATE module_enrollments
      SET
        status  = 'completed',
        updated = strftime('%Y-%m-%d %H:%M:%f', 'now') || 'Z'
      WHERE module = NEW.id
        AND status NOT IN ('completed', 'dropped', 'failed');
    END;
  `).execute();
}, (app) => {
  app.db().newQuery(
    "DROP TRIGGER IF EXISTS trg_complete_enrollments_on_module_graded;"
  ).execute();
});
