import { Router } from "express";
import tasks from "../controllers/server.controller.js";
import users from "../controllers/users.controller.js";
import usersValidator from "../validator/users.validator.js";
import passport from "../auth/auth.js";
import currentUser from "../middleware/currentUser.js";

const router = Router();
const cert = passport.authenticate("client-cert", { session: false });

// No cert needed routes
router.get("/", tasks.default);

// Check for cert
router.use(passport.initialize());

// Routes
router.get("/users/", cert, ...usersValidator.get, users.get);
router.get("/posts/", cert, users.posts);
router.post("/posts/create", cert, ...usersValidator.createPost, users.createPost);
router.delete("/posts/:id", cert, users.deletePost);
router.patch("/users/:username/update", cert, ...usersValidator.update, users.update);
export default router;
