/// <reference path="../pb_data/types.d.ts" />
// Is an @username free? The profile editor asks while the learner types (docs/ideas/profile-customization.md item 23).
//   GET /api/akademiya/username/{name}  ->  { "free": true | false }
// Only for a signed-in learner, and rate limited (pb_migrations/1793300000_username_rate_limit.js). `users` can only list the
// learner's own record, so the app cannot find another learner's name by itself; this answers yes or no and nothing else.
// The learner's own name counts as free. A database failure is a 500 (the app then shows nothing), never "free".
routerAdd("GET", "/api/akademiya/username/{name}", (e) => {
  const name = e.request.pathValue("name");
  if (!/^[a-z0-9_]{3,20}$/.test(name)) return e.json(400, { free: false });
  const taken = $app.countRecords("users", $dbx.exp("username = {:name} AND id != {:me}", { name: name, me: e.auth.id }));
  return e.json(200, { free: taken === 0 });
}, $apis.requireAuth("users"));
