migrate((app) => {
  // Step 1: Make news.fullContent optional so articles can be built purely from blocks
  const newsColl = app.findCollectionByNameOrId("news");
  const fcField = newsColl.fields.getByName("fullContent");
  if (fcField) {
    fcField.required = false;
    app.save(newsColl);
  }

  // Step 2: Create news_blocks collection
  // Each block belongs to exactly one news record (cascadeDelete keeps things clean).
  // Only IMAGE and TEXT types are supported — no video.
  const newsId = app.findCollectionByNameOrId("news").id;

  const blocks = new Collection({
    name: "news_blocks",
    type: "base",
    listRule: "",   // public can list (same visibility as news)
    viewRule: "",   // public can view
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      {
        type: "relation", name: "news_id", required: true,
        collectionId: newsId, maxSelect: 1, cascadeDelete: true
      },
      {
        type: "select", name: "type", required: true,
        values: ["image", "text"], maxSelect: 1
      },
      // text_content: used by TEXT blocks (supports HTML)
      { type: "text", name: "text_content", max: 50000 },
      // image: used by IMAGE blocks
      {
        type: "file", name: "image",
        maxSelect: 1, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
      },
      // sort_order: lower = earlier in the story; 0-indexed
      { type: "number", name: "sort_order", min: 0 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
  });
  app.save(blocks);
}, (app) => {
  // Rollback
  try {
    const c = app.findCollectionByNameOrId("news_blocks");
    app.delete(c);
  } catch {}

  // Restore fullContent as required
  const newsColl = app.findCollectionByNameOrId("news");
  const fcField = newsColl.fields.getByName("fullContent");
  if (fcField) {
    fcField.required = true;
    app.save(newsColl);
  }
});
