import { body, query, validationResult, param } from "express-validator";
const usersValidator = {};

const validator = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    next();
};

usersValidator.register = [
    body("username").notEmpty().escape().trim().isString(),
    body("password").notEmpty().escape().trim().isString().isLength({ min: 6 }),
    validator
];

usersValidator.get = [
    query("username").notEmpty().escape().trim().isString(),
    validator
];

usersValidator.login = [
    body("username").notEmpty().escape().trim().isString(),
    body("password").notEmpty().escape().trim().isString(),
    validator
];

usersValidator.follow = [
    param("username").notEmpty().escape().trim().isString(),
    validator
]

usersValidator.createPost = [
    body("text").notEmpty().escape().trim().isString(),
    validator
]

usersValidator.deletePost = [
    param("id").notEmpty().escape().trim().isInt(),
    validator
]

usersValidator.update = [
    param("username").notEmpty().escape().trim().isString(),
    body("user").notEmpty().isObject(),
    validator
]

usersValidator.postsFollowing = [
    param("username").notEmpty().escape().trim().isString(),
    validator
]
export default usersValidator;
