/// <reference path="../pb_data/types.d.ts" />
// Is an @username free? The profile editor asks while the learner types (docs/ideas/profile-customization.md item 23).
//   GET /api/akademiya/username/{name}  ->  { "free": true | false }
// Only for a signed-in learner. `users` can only list the learner's own record, so the app cannot find another
// learner's name by itself; this answers yes or no and nothing else. The learner's own name counts as free.
routerAdd("GET", "/api/akademiya/username/{name}", (e) => {
  const name = e.request.pathValue("name");
  if (!/^[a-z0-9_]{3,20}$/.test(name)) return e.json(400, { free: false });
  try {
    $app.findFirstRecordByFilter("users", "username = {:name} && id != {:me}", { name: name, me: e.auth.id });
    return e.json(200, { free: false });
  } catch (_) {
    return e.json(200, { free: true });
  }
}, $apis.requireAuth("users"));
