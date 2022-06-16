const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server running at http://localhost:3000")
    );
  } catch (e) {
    console.log(`DB error :${e.message}`);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUsernameQuery = `
        SELECT * FROM user
            WHERE username='${username}'
    `;
  const dbUser = await db.get(selectUsernameQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createNewUserQuery = `
                INSERT INTO 
                    user (username,name,password,gender,location)
                    VALUES ('${username}','${name}','${hashedPassword}',
                    '${gender}','${location}');
            `;
      await db.run(createNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid Password");
    } else {
      response.send("Login Success!");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const currentUserQuery = `
        SELECT * FROM user 
        WHERE username='${username}';
    `;
  const currentUser = await db.get(currentUserQuery);
  const isCurrentPasswordCorrect = await bcrypt.compare(
    oldPassword,
    currentUser.password
  );
  if (isCurrentPasswordCorrect === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword);
      const updatePasswordQuery = `
            UPDATE user
            SET
                password='${hashedNewPassword}'
            WHERE 
                username='${username}';
      `;
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = app;
