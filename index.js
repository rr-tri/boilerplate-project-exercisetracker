const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors')
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const users = {};
const exercises = {};
// Generate unique IDs for users and exercises
let userIdCounter = 1;
let exerciseIdCounter = 1;

const  getCurrentDate= () => {
  const currentDate = new Date();
  return currentDate.toDateString();
}

//* Create a new user

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const userId = `user_${userIdCounter++}`;
  users[userId] = { username, _id: userId };
  res.json(users[userId]);
});

//* GET /api/users - Get a list of all users
app.get('/api/users', (req, res) => {
  const userList = Object.values(users);
  res.json(userList);
});

//* Create a new exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const exerciseId = `exercise_${exerciseIdCounter++}`;
  const exerciseDate = date || getCurrentDate();

  exercises[exerciseId] = {
    username: users[_id].username,
    description,
    duration: parseInt(duration),
    date: exerciseDate,
    _id: exerciseId,
  };

  res.json(exercises[exerciseId]);
});

//* Retrieve exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  if (!users[_id]) {
    return res.status(404).json({ error: 'User not found' });
  }

  let log = Object.values(exercises).filter((exercise) => exercise.username === users[_id].username);

  if (from || to) {
    log = log.filter((exercise) => {
      const exerciseDate = new Date(exercise.date);
      if (from && exerciseDate < new Date(from)) return false;
      if (to && exerciseDate > new Date(to)) return false;
      return true;
    });
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  res.json({
    username: users[_id].username,
    count: log.length,
    _id: users[_id]._id,
    log,
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
