/// <reference path="../pb_data/types.d.ts" />
// Akademiya English, local server (tech-stack.md §0b). Mirrors what the browser version keeps (src/web/app.js, record.js):
//   users      the built-in auth collection, plus `settings` (goal, reminder, dark, sound, speaking, saveVoice, cast)
//   events     the growing list of what happened: onboarding, lesson, confidence, account, feedback (append-only)
//   recordings the learner's own voice, one clip per phrase, the newest wins; only the learner can read it
//   feedback   "something wrong? tell us", with an optional screenshot; only the team reads it (dashboard)
// Usage numbers are worked out from `events` in the dashboard. Deleting a user deletes all of their rows and files.
const OWN = "user = @request.auth.id";
const CREATE_OWN = "@request.auth.id != '' && @request.body.user = @request.auth.id";

migrate((app) => {
  const settings = app.settings();
  settings.meta.appName = "Akademiya English (local)";
  app.save(settings);

  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new JSONField({ name: "settings", maxSize: 20000 }));
  app.save(users);

  const rel = { name: "user", type: "relation", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true };

  app.save(new Collection({
    type: "base", name: "events",
    listRule: OWN, viewRule: OWN, createRule: CREATE_OWN, updateRule: null, deleteRule: null,
    fields: [
      rel,
      { name: "client_id", type: "text", required: true, max: 64 },   // made on the phone, so an offline event is sent once
      { name: "type", type: "select", required: true, maxSelect: 1, values: ["onboarding", "lesson", "confidence", "account", "feedback"] },
      { name: "at", type: "date", required: true },                   // when it happened on the phone, not when it arrived
      { name: "data", type: "json", maxSize: 50000 },                 // the rest of the event, as the browser version keeps it
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_events_user_client ON events (user, client_id)",
      "CREATE INDEX idx_events_type_at ON events (type, at)",
    ],
  }));

  app.save(new Collection({
    type: "base", name: "recordings",
    listRule: OWN, viewRule: OWN, createRule: CREATE_OWN,
    updateRule: OWN + " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)", deleteRule: OWN,
    fields: [
      rel,
      { name: "phrase", type: "text", required: true, max: 64 },
      { name: "audio", type: "file", required: true, maxSelect: 1, maxSize: 5 * 1024 * 1024, protected: true,
        mimeTypes: ["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg"] },
      { name: "ms", type: "number", onlyInt: true, min: 0 },
      { name: "at", type: "date", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_recordings_user_phrase ON recordings (user, phrase)"],
  }));

  app.save(new Collection({
    type: "base", name: "feedback",
    listRule: null, viewRule: null, createRule: CREATE_OWN, updateRule: null, deleteRule: null,
    fields: [
      rel,
      { name: "text", type: "text", required: true, max: 5000 },
      { name: "screen", type: "text", max: 200 },                     // which screen it was sent from
      { name: "screenshot", type: "file", maxSelect: 1, maxSize: 5 * 1024 * 1024, protected: true, mimeTypes: ["image/png", "image/jpeg"] },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
  }));
}, (app) => {
  for (const name of ["feedback", "recordings", "events"]) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (e) {}
  }
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("settings");
  app.save(users);
});
