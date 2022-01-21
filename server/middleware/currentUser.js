import findUser from "../helper/findUser.js";

export default function (req, res, next) {
  const username = req.socket.getPeerCertificate().subject.CN;
  const user = findUser(username);

  if (!user) return res.status(404).json({ errors: [{ msg: "User not found" }] });

  req.user = user;
  next();
};