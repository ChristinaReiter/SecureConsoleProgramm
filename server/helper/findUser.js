import db from "../database/db.js";

export default function (username){
  const users = db.data.users;
  for (const _id in users) {
    const user = users[_id];
    if (user.username == username) {
      return user;
    }
  }
  return null;
}