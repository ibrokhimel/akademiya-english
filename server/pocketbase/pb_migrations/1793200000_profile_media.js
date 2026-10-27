/// <reference path="../pb_data/types.d.ts" />
// The profile customization (docs/ideas/profile-customization.md): a learner's own picture, banner and page background, and an @username.
//   users.avatar, banner, background   one picture, GIF or short video each (8 MB); only the learner can open them (protected)
//   users.username                     3-20 of a-z 0-9 _; may be empty, but a name in use is unique
// The rest of the profile (colours, frame, title, bio...) travels inside `settings.profile`, which `settings` already holds.
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];
const MEDIA_SIZE = 8 * 1024 * 1024;

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  // PocketBase's own users collection already has an `avatar` file field: widen it instead of adding a second one.
  const avatar = users.fields.getByName("avatar");
  if (avatar) {
    avatar.maxSelect = 1; avatar.maxSize = MEDIA_SIZE; avatar.mimeTypes = MEDIA_TYPES; avatar.protected = true;
  } else {
    users.fields.add(new FileField({ name: "avatar", maxSelect: 1, maxSize: MEDIA_SIZE, mimeTypes: MEDIA_TYPES, protected: true }));
  }
  for (const name of ["banner", "background"])
    users.fields.add(new FileField({ name, maxSelect: 1, maxSize: MEDIA_SIZE, mimeTypes: MEDIA_TYPES, protected: true }));
  users.fields.add(new TextField({ name: "username", max: 20, pattern: "^[a-z0-9_]{3,20}$" }));
  // a partial index, so any number of learners can leave the name empty
  users.addIndex("idx_users_username", true, "username", "username != ''");
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.removeIndex("idx_users_username");
  for (const name of ["banner", "background", "username"]) users.fields.removeByName(name);
  app.save(users);
});
