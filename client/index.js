import axios from "axios";
import fs from "fs";
import https from "https";
import { exit } from "process";
import readline from "readline-sync";

const URL = "https://localhost:3000";
const URL2 = "https://localhost:3001";
let instance = axios.create({
  httpsAgent: new https.Agent({
    cert: null,
    key: null,
    passphrase: "secret",
    rejectUnauthorized: false,
  }),
});

const createInstance = (cert, key) => {
  return axios.create({
    httpsAgent: new https.Agent({
      cert,
      key,
      passphrase: "secret",
      rejectUnauthorized: false,
    }),
  });
};

const clear = () => {
  console.log("\x1Bc");
};

const login = async () => {
  clear();
  const username = readline.question("Username: ");
  const password = readline.question("Password: ");
  try {
    const response = await instance.post(`${URL}/users/login`, {
      username,
      password,
    });
    const { cert, key, user } = response.data;
    readline.question("Press enter to continue...");
    return { cert, key, user };
  } catch (e) {
    clear();
    console.warn("ERROR");
    if (e && e.response && e.response.data) {
      for (const error of e.response.data.errors) {
        console.log(error);
        console.error(`${error.param || "error"}: ${error.msg}`);
      }
    } else console.error("Server unavailable");
  }
  readline.question("Press enter to continue...");
  return null;
};

const register = async () => {
  clear();
  const username = readline.question("Username: ");
  const password = readline.question("Password: ");
  try {
    const response = await instance.post(`${URL}/users/register`, {
      username,
      password,
    });

    readline.question("Press enter to continue...");
    const { cert, key, user } = response.data;
    return { cert, key, user };
  } catch (e) {
    clear();
    console.warn("ERROR");
    if (e && e.response && e.response.data) {
      for (const error of e.response.data.errors) {
        console.error(`${error.param || "error"}: ${error.msg}`);
      }
    } else console.error("Server unavailable");
  }
  readline.question("Press enter to continue...");
  return null;
};

const main = async () => {
  clear();
  let user = null;
  while (!user) {
    console.log("##################### APP #####################");
    console.log("#                                             #");
    console.log("#    1. Login                                 #");
    console.log("#    2. Register                              #");
    console.log("#                                             #");
    console.log("#    0. Exit                                  #");
    console.log("#                                             #");
    console.log("###############################################");
    const option = readline.question("Option: ");
    switch (option) {
      case "1":
        user = await login();
        break;
      case "2":
        user = await register();
        break;
      case "0":
        exit();
      default:
        console.log("Invalid option");
        continue;
    }
    clear();
  }
  await app(user);
};

const app = async (user) => {
  instance = createInstance(user.cert, user.key);
  clear();
  while (true) {
    console.log("##################### APP #####################");
    console.log("#                                             #");
    console.log("#    1. Display Timeline                      #");
    console.log("#    2. Create Post                           #");
    console.log("#    3. Delete Post                           #");
    console.log("#    4. Display User Posts                    #");
    console.log("#    5. Follow User                           #");
    console.log("#                                             #");
    console.log("#    0. Logout                                #");
    console.log("#                                             #");
    console.log("###############################################");
    const option = readline.question("Option: ");
    switch (option) {
      case "1":
        await display_timeline();
        break;
      case "2":
        await create_post();
        break;
      case "3":
        await delete_post();
        break;
      case "4":
        await display_user_posts();
        break;
      case "5":
        await follow_user(user);
        break;
      case "0":
        return;
      default:
        console.log("Invalid option");
        continue;
    }
    clear();
  }
};

function compararNumeros(a, b) {
  return a.id - b.id;
}

const display_timeline = async () => {
  clear();
  let allposts = [];

  try {
    console.log("DISPLAY THE TIMELINE HERE");
    const res = await instance.get(`${URL2}/posts/`);
    const response = res.data.posts;
    for (const [key, value] of Object.entries(response)) {
      for (const val of value) {
        allposts.push({ id: val.id, text: val.text, user: key });
      }
    }
    allposts.sort(compararNumeros);

    for (const i of allposts) {
      console.log(`${i.user} - ${i.id} : ${i.text}`);
    }

    readline.question("Press enter to continue...");
    return;
  } catch (e) {
    clear();
    console.warn("ERROR");
    if (e && e.response && e.response.data) {
      console.log(e.response.data.errors);
    } else console.error("Server unavailable");
  }
  readline.question("Press enter to continue...");
  return null;
};

const delete_post = async () => {
  clear();
  const number = readline.questionInt("Delete a Post: ");
  try {
    const res = await instance.get(`${URL2}/posts/`);
    const response = res.data.posts;
    for (const [key, value] of Object.entries(response)) {
      for (const val of value) {
        if (val.id == number) {
          const res = await instance.delete(`${URL2}/posts/${number}`);
          if (res.status == 200) console.log("Post deleted");
          break;
        }
      }
    }
    readline.question("Press enter to continue...");
    return;
  } catch (e) {
    clear();
    console.warn("ERROR");
    if (e && e.response && e.response.data) {
      for (const error of e.response.data.errors) {
        console.error(`${error.param + '' || "error"}: ${error.msg + ''}`);
      }
    } else console.error("Server unavailable");
  }
  readline.question("Press enter to continue...");
  return null;
};

const display_user_posts = async () => {
  let username = readline.question("Search for a username:");
  clear();
  try {
    const res = await instance.get(`${URL}/posts/`);
    const response = res.data.posts;
    for (const [key, value] of Object.entries(response)) {
      if (key == username) {
        console.log(key + "'s posts:");
        for (const val of value) {
          console.log("    -" + val.text);
        }
      }
    }
    readline.question("Press enter to continue...");
    return;
  } catch (e) {
    //clear();
    console.warn("ERROR");
    if (e && e.response && e.response.data) {
      for (const error of e.response.data.errors) {
        console.error(`${error.param || "error"}: ${error.msg}`);
      }
    } else console.error("Server unavailable");
  }
  readline.question("Press enter to continue...");
  return null;
};

const follow_user = async (user) => {
  clear();
  const username = readline.question("Search for a username: ");
  try {
    const res = await instance.post(`${URL}/users/${username}/follow`);
    console.log("You are now following  the User : " + username);
    readline.question("Press enter to continue...");
    return;
  } catch (e) {
    clear();
    console.warn("ERROR");
    if (error.response) {
      console.log(`${error.response.status} - ${error.response.data.errors[0].msg || "error"}`);
    } else console.error("Server unavailable");
  }
  readline.question("Press enter to continue...");
  return null;
};

const create_post = async () => {
  clear();
  let text = readline.question("Type here your post: ");
  try {
    const response = await instance.post(`${URL2}/posts/create`, { text });
    readline.question("Press enter to continue...");
    return;
  } catch (error) {
    clear();
    if (error.response) {
      console.log(`${error.response.status} - ${error.response.data.errors[0].msg || "error"}`);
    }
    else
      console.log("Server unavailable");
  }
  readline.question("Press enter to continue...");
  return null;
};

while (1) await main();
