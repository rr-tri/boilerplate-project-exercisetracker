const express = require("express");
const app = express();
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// mongoose setup
mongoose.set("strictQuery", false);
console.log("Starting to establish connection to MongoDB");
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms '
  )
);
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
// Create User and Exercise Schemas
const userSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: mongoose.ObjectId,
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    const user = new User({ username });
    const newUser = await user.save();
    // console.log("savedUser = ", newUser);
    if (newUser) {
      res.status(201).json({ username: newUser.username, _id: newUser._id });
    }
  } catch (err) {
    res.status(400).json({ error: "some thing went wrong" });
    console.error(err.message);
  }
});
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    // console.log("user",users)
    const userList = users.map((user) => ({
      username: user.username,
      _id: user._id,
    }));
    res.json(userList);
  } catch (err) {
    res.status(400).json({ error: "some thing went wrong" });
    console.error(err.message);
  }
});
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { _id } = req.params;
    const { description, duration, date } = req.body;
    if (!description || !duration) {
      return res
        .status(400)
        .json({ error: "Description and duration are required" });
    }
    const exercise = new Exercise({
      userId: _id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });
    const newExercise = await exercise.save();
    console.log("newExercise = ", newExercise);
    const user = await User.findById(_id);
    console.log("User = ", user);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    
    res.json({
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(),
      _id: newExercise.userId,
    });
  } catch (err) {
    res.status(400).json({ error: "some thing went wrong" });
    console.error(err);
  }
});
app.get("/api/exercises", async (req, res) => {
  try {
    const exercises = await Exercise.find({});
    // console.log("exercise",exercises)
    const exerciseList = exercises.map((exercise) => ({
      userId: exercise.userId,
      duration: exercise.duration,
      description: exercise.description,
      date: exercise.date.toDateString(),
      _id: exercise._id,
    }));
    res.json(exerciseList);
  } catch (err) {
    res.status(400).json({ error: "some thing went wrong" });
    console.error(err.message);
  }
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const user = await User.findById(_id);
  if (!user) return res.status(400).json({ error: "User not found" });
  const query = { userId: _id };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  const exercises = await Exercise.find(query)
    .limit(limit ? parseInt(limit) : undefined)
    .exec();
  const log = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }));
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log,
  });
});
// //* Create a new user
// app.post('/api/users', (req, res) => {
//   const { username } = req.body;
//   if (!username) {
//     return res.status(400).json({ error: 'Username is required' });
//   }
//   const userId = `user_${userIdCounter++}`;
//   users[userId] = { username, _id: userId };
//   res.json(users[userId]);
// });
// //* GET /api/users - Get a list of all users
// app.get('/api/users', (req, res) => {
//   const userList = Object.values(users);
//   res.json(userList);
// });
// //* Create a new exercise
// app.post('/api/users/:_id/exercises', (req, res) => {
//   const { _id } = req.params;
//   const { description, duration, date } = req.body;
//   console.log(req.body)
//   if (!description || !duration) {
//     return res.status(400).json({ error: 'Description and duration are required' });
//   }

//   const exerciseDate = date || getCurrentDate();
//   const exerciseId = exerciseIdCounter++
//   exercises[exerciseId] = {
//     username: users[_id].username,
//     description,
//     duration: parseInt(duration),
//     date: exerciseDate,
//     _id: exerciseId,
//   };

//   res.json({

//     _id: users[_id]._id,
//     username: users[_id].username,
//     description,
//     duration: parseInt(duration),
//     date: exerciseDate,
//   });
// });
// //* Retrieve exercise log
// app.get('/api/users/:_id/logs', (req, res) => {
//   const { _id } = req.params;
//   const { from, to, limit } = req.query;

//   if (!users[_id]) {
//     return res.status(404).json({ error: 'User not found' });
//   }

//   let log = Object.values(exercises).filter((exercise) => exercise.username === users[_id].username);

//   if (from || to) {
//     log = log.filter((exercise) => {
//       const exerciseDate = new Date(exercise.date);
//       if (from && exerciseDate < new Date(from)) return false;
//       if (to && exerciseDate > new Date(to)) return false;
//       return true;
//     });
//   }

//   if (limit) {
//     log = log.slice(0, parseInt(limit));
//   }

//   res.json({
//     username: users[_id].username,
//     count: log.length,
//     _id: users[_id]._id,
//     log,
//   });
// });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
