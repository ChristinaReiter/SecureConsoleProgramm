import accessControl from './access.controller.js';
import db from '../database/db.js';

const tasks = {};

tasks.default = (req, res) => {
    res.send('Hello World!');
};

export default tasks;