// Console log colors, (pretty :D)
const greenLog = "\x1b[32m%s\x1b[0m";
const redLog = "\x1b[31m%s\x1b[0m";

// Import libraries
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

// Import mongodb models from schemas.js file
const { User, Exercise } = require("./schemas");

// MongoDb connection
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => console.log(greenLog, "Connected to MongoDB"))
  .catch(err => console.error(redLog, "Error connecting to MongoDB:", err));


// Middleware
// ----------
// Connects to fCC tests
app.use(cors());

// Decode the body of a req
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Serve static css file from pubic directory
app.use(express.static("public"));


// Home http route
// ---------------
// Serves html file from views directory
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});


// API endpoint routes
// -------------------
// 1. GET all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.log(redLog, "Get all users ERROR: ", error);
    res.json({ error: error.message });
  }
});

// 2. POST a user
app.post("/api/users", async (req, res) => {
  const username = req.body.username;

  try {
    // Find existing user
    let foundUser = await User.findOne({ username: username });

    // Send existing user document back
    if (foundUser) {
      return res.json({
        username: foundUser.username,
        _id: foundUser._id
      });
    } 

    // Create and save a new user
    const newUser = new User({ username: username });
    const savedUser = await newUser.save();

    // Send new user document back
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (error) {
    console.log(redLog, "POST a user ERROR: ", error)
    res.json({ error: error.message });
  }
});

// 3. POST an exercise
app.post("/api/users/:_id/exercises", async (req, res) => {

  const isDateValid = (date) => {
    return !isNaN(new Date(date))
  }

  let date = req.body.date;

  if (date == "" || date == undefined) {
    date = new Date().toDateString();
  } else if (isDateValid(date)) {
    date = new Date(date);
    date.setDate(date.getDate() + 1);
    date = date.toDateString();
  }

  try {
    // Find a user with matching ID
    let foundUser = await User.findById(req.params._id);

    // If there is no match, return error
    if (!foundUser) {
      return res.send("User not found in database");
    }

    // Create and save an exercise
    const newExercise = new Exercise({
      username: foundUser.username,
      description: req.body.description,
      duration: req.body.duration,
      date: date
    });
    const savedExercise = await newExercise.save();

    // Send new exercise document back
    res.json({ 
      _id: foundUser._id,
      username: savedExercise.username,
      date: savedExercise.date,
      duration: savedExercise.duration,
      description: savedExercise.description,
    });

  } catch (error) {
    console.log(redLog, "POST an exercise ERROR: ", error);
    res.json({ error: error.message });
  }
});

// 4. GET exercise logs 
app.get("/api/users/:_id/logs", async (req, res) => {
  let limit = req.query.limit;

  try {
    // Find a user with matching ID
    let foundUser = await User.findById(req.params._id);
    if (!foundUser) {
      return res.send(`User: ${req.params._id} not found in database`);
    }

    // Find exercise logs with matching username
    let exerciseLogs = await Exercise.find({ username: foundUser.username }).select("-_id -__v -username");

    // Check if user has no exercise logs
    if (exerciseLogs.length === 0) {
      return res.send(`User: ${foundUser.username} has no exercise logs`);
    }

    // Filter based on from and to dates
    if (req.query.from || req.query.to) {
      let fromDate = req.query.from ? new Date(req.query.from) : null;
      let toDate = req.query.to ? new Date(req.query.to) : null;

      if (fromDate || toDate) {
        exerciseLogs = exerciseLogs.filter((log) => {
          let logDate = new Date(log.date);
          return (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate);
        });
      }
    }

    // Limit the number of results
    if (limit) {
      exerciseLogs = exerciseLogs.slice(0, limit);
    }

    // Send user info and exercise logs back
    res.json({
      username: foundUser.username,
      count: exerciseLogs.length,
      _id: req.params._id,
      log: exerciseLogs
    });

  } catch (error) {
    console.log(redLog, "GET exercise logs ERROR: ", error);
    res.json({ error: error.message });
  }
});


// Server Port
// -----------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(greenLog, "Your app is listening on port " + listener.address().port);
});
