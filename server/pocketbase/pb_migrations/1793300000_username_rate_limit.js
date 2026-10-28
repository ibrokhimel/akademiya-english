/// <reference path="../pb_data/types.d.ts" />
// A rate limit for the "is this @username free?" check (pb_hooks/username.pb.js): 10 asks per 10 seconds per learner / address,
// so nobody can walk the list of names. The app asks once after a short pause in typing, far below this.
// Rate limits were off on this server. Turning them on would also switch on PocketBase's own default rules
// (20 creates per 5 s would stop a long offline sync), so when they were off only this rule stays; when they were
// already on, this rule is added to the ones there.
migrate((app) => {
  const label = "/api/akademiya/username/";
  const settings = app.settings();
  const limits = settings.rateLimits;
  const kept = limits.enabled ? limits.rules.filter((r) => r.label !== label).map((r) => ({ label: r.label, audience: r.audience, duration: r.duration, maxRequests: r.maxRequests })) : [];
  limits.rules = [{ label, audience: "", duration: 10, maxRequests: 10 }, ...kept]; // first, so the general "/api/" rule cannot match before it
  limits.enabled = true;
  app.save(settings);
}, (app) => {
  const label = "/api/akademiya/username/";
  const settings = app.settings();
  const limits = settings.rateLimits;
  limits.rules = limits.rules.filter((r) => r.label !== label).map((r) => ({ label: r.label, audience: r.audience, duration: r.duration, maxRequests: r.maxRequests }));
  if (!limits.rules.length) limits.enabled = false;
  app.save(settings);
});
