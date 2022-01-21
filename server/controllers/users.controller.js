import db from "../database/db.js";
import { hash, verify } from "argon2";
import certGenerator from "../gen.js";
import axios from "axios";
import https from "https";
import fs from "fs";
import ac from "./access.controller.js";
/*
    User schema:
    {
        id: Number,
        username: '',
        password: '',
        posts: [],
        role: ''
    }
*/
const inst = (cert, key) => {
  let instance = axios.create({
    httpsAgent: new https.Agent({
      cert: cert,
      key: key,
      passphrase: "secret",
      rejectUnauthorized: false,
    }),
  });
  return instance;
}

const users = {};

users.register = async (req, res) => {
  const { username, password } = req.body;
  let role = "reader";

  // Check if user already exists
  const users = db.data.users;
  for (const _id in users) {
    const user = users[_id];
    if (user.username === username) {
      return res.status(422).json({ errors: [{ msg: "User already exists" }] });
    }
  }

  // Add user to database
  const psw = await hash(password);
  const user = {
    id: db.data.users.length + 1,
    username,
    password: psw,
    posts: [],
    following: [],
    role,
  };
  db.data.users.push(user);
  await db.write();
  const { key, cert } = certGenerator.client(user.username);
  res.status(200).json({ message: "User created", user, cert, key });
};

users.get = async (req, res) => {
  const users = db.data.users;
  for (const _id in users) {
    const user = users[_id];
    console.log(req.query.username);
    if (user.username == req.query.username) {
      return res.status(200).json({ user });
    }
  }
  return res.status(404).json({ errors: [{ msg: "User not found" }] });
};

users.login = async (req, res) => {
  const users = db.data.users;
  for (const _id in users) {
    const user = users[_id];
    if (user.username == req.body.username) {
      const match = await verify(user.password, req.body.password);
      if (match) {
        const { key, cert } = certGenerator.client(user.username);
        return res
          .status(200)
          .json({ message: "User logged in", user: user, cert, key });
      }
      break;
    }
  }
  return res.status(404).json({
    errors: [{ msg: "User not found with the specified credentials" }],
  });
};

users.follow = async (req, res) => {
  const username = req.params.username;

  if (!username) {
    return res.status(422).json({ errors: [{ msg: "No username specified" }] });
  }
  const _username = req.socket.getPeerCertificate().subject.CN;
  const users = db.data.users;
  let userExists = false;
  for (const _id in users) {
    const user = users[_id];
    if (user.username == username) {
      userExists = true;
      break;
    }
  }
  if (!userExists)
    return res.status(404).json({ errors: [{ msg: "User not found" }] });

  for (const _id in users) {
    const user = users[_id];
    if (user.username == _username) {
      let re = ac.can(user.role).createAny("follow");
      console.log(re.granted)
      if (!re.granted) {
        return res.status(403).json({ errors: [{ msg: "Forbidden" }] });
      }
      if (user.following.includes(username)) {
        return res.status(422).json({ errors: [{ msg: "Already following user" }] });
      }
      user.following.push(username);
      break;
    }
  }
  await db.write();
  return res.status(200).json({ message: "User followed" });
};

users.posts = async (_req, res) => {
  let posts = {};

  const users = db.data.users;
  for (let user of users) {
    for (let post of user.posts) {
      if (user.username in posts) {
        posts[user.username].push(post);
      } else {
        posts[user.username] = [post];
      }
    }
  }
  return res.status(200).json({ posts });
};

users.createPost = async (req, res) => {
  const users = db.data.users;
  const { text } = req.body;
  let nPosts = 1;
  let find = false;

  while(!find){
    find = true;
    for (const user of users) {
      for (const post of user.posts) {
        if(post.id == nPosts){
          find = false;
          nPosts++;
          break;
        }
      }
    }
  }
  
  const post = { id: nPosts, text };
  for (const user of users) {
    if (user.username == req.socket.getPeerCertificate().subject.CN) {
      let re = ac.can(user.role).createOwn("post");
      if (!re.granted) {
        return res.status(403).json({ errors: [{ msg: "Forbidden" }] });
      }
      user.posts.push(post);
      break;
    }
  }
  await db.write();
  return res.status(200).json({ message: "Post created" });
};

users.deletePost = async (req, res) => {
  const _username = req.socket.getPeerCertificate().subject.CN;
  const cert = req.socket.getPeerCertificate();
  const users = db.data.users;
  const { id } = req.params;

  let _user = null;
  for (const user of users)
    for (const post of user.posts) {
      if (post.id == id) {
        _user = user;
      }
    }

  if (!_user) return res.status(404).json({ errors: [{ msg: "Post not found" }] });

  if (_user.username != _username) {
    let re = ac.can(_user.role).deleteAny("post");
    if (!re.granted) {
      return res.status(403).json({ errors: [{ msg: "Forbidden" }] });
    }
  } else {
    let re = ac.can(_user.role).deleteOwn("post");
    if (!re.granted) {
      return res.status(403).json({ errors: [{ msg: "Forbidden" }] });
    }
    for (let post of _user.posts) {
      if (post.id == id) {
        _user.posts.splice(_user.posts.indexOf(post), 1);
        let _cert = fs.readFileSync("cert/cert_server.pem");
        let key = fs.readFileSync("cert/key_server.pem");
        let instance = inst(_cert, key);
        try {
          // let response = await instance.patch(`https://localhost:3000/users/${_user.username}/update`, {
          //   user: _user
          // });
          await db.write();
          return res.status(200).json({ message: "Post deleted" });
        } catch (err) {
          console.log(err);
          return res.status(500).json({ errors: [{ msg: "Server error" }] });
        }
        return res.status(200).json({ message: "Post deleted" });
      }
    }
  }
  return res.status(404).json({ errors: [{ msg: "User not authorized" }] });
};

users.update = async (req, res) => {
  const _username = req.socket.getPeerCertificate().subject.CN;
  const { user } = req.body;
  const { username } = req.params;

  const users = db.data.users;
  let _user = null;
  for (const user of users)
    if (user.username == _username) _user = user;

  for (let i = 0; i < users.length; i++) {
    if (users[i].username == username) {
      if (users[i].username != _username) {
        let re = ac.can(_user.role).updateAny("user");
        console.log(re)
        if (!re.granted) {
          return res.status(403).json({ errors: [{ msg: "Forbidden" }] });
        }
      }
      users[i] = user;
      await db.write();
      return res.status(200).json({ message: "User updated" });
    }

  }
  return res.status(404).json({ errors: [{ msg: "User not found" }] });
}

users.postsFollowing = async (req, res) => {
  let _cert = fs.readFileSync("cert/cert_server.pem");
  let key = fs.readFileSync("cert/key_server.pem");
  let instance = inst(_cert, key);
  const { username } = req.params;
  let user = null;

  for (let _user of db.data.users) {
    if (_user.username == username) {
      user = _user;
    }
  }
  if (!user) return res.status(404).json({ errors: [{ msg: "User not found" }] });

  const following = user.following;
  let response = {};
  try {
    let response_ = await instance.get('https://localhost:3000/posts');
    console.log(response_.data.posts);
    for (const [id, post] of Object.entries(response_.data.posts)) {
      console.log(following)
      console.log(id)
      if (following.includes(id)) {
        response[id] = post;
      }
    }
    return res.status(200).json({ posts: response });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ errors: [{ msg: "Server error" }] });
  }

};

export default users;

