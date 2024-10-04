const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const res = require('express/lib/response');
require('dotenv').config();
let nanoid;
(async () => {
  nanoid = (await import('nanoid')).nanoid;
})();

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//////////////////////////////////////////////////////////////////////////////////////////

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Failed to connect:', err));

const UsersSchema = new mongoose.Schema({
  username: {type: String, required: true}
});

const ExercisesSchema = new mongoose.Schema({
  user_id: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String, required: false}
});

const User = mongoose.model('User',UsersSchema);
const Exercise = mongoose.model('Exercise',ExercisesSchema);

const createAndSaveUser = async (username) => {
  const user = new User({ username: username });

  try {
    const savedUser = await user.save();
    return savedUser; 
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const createAndSaveExercise = async (id,description,duration,date) => {
  console.log("createAndSaveExercise");
  const exercise = new Exercise({ user_id: id, description: description, duration: duration, date: date });
  console.log(date);
  try {
    const savedExercise = await exercise.save();
    console.log("saved exercise: ",savedExercise);
    return savedExercise; 
  } catch (err) {
    console.log("error in createAndSaveExercise");
    console.log(err);
    throw err;
  }
}

const returnAllUsers = async () => {
  try {
    const users = await User.find({});
    return users;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const findUserById = async (id) => {
  console.log("findUserById: ",id);
  try {
    const user = await User.findOne({_id: id});
    return user;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////

const isValidDateFormat = (dateString) => {
  console.log("isValidDateFormat:",dateString);
  if (!dateString) {
    return new Date().toISOString().slice(0, 10);
  }
  dateString = dateString.trim();
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateString === '') {
    return new Date().toISOString().slice(0, 10);
  } else if (!regex.test(dateString)) {
    return '';
  } else {
    return dateString;
  }
};

//////////////////////////////////////////////////////////////////////////////////////////

app.post("/api/users", async (req,res) => {
  const { username } = req.body;
  if (username.trim() === '') {
    res.json({ "error": "please enter a value" })
    return
  }
  try {
    const savedUser = await createAndSaveUser(username);
    res.json({ "username": savedUser.username, "_id": savedUser._id })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
});

app.post('/api/users/:_id/exercises', async (req,res) => {
  let invalid = [];
  const { _id: id } = req.params;
  const { description, duration } = req.body;
  let { date } = req.body;
  //is id real
  try {
    const userDetails = await findUserById(id);
    if (!userDetails) {
      invalid.push("invalid user id");
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  };
  //is description there
  if (description.trim() === '') {
    invalid.push("invalid description")
  }
  //is duration there and formatted correctly
  if (isNaN(duration)) {
    invalid.push("duration must be an integer")
  }
  //is date there and if not get date
  date = isValidDateFormat(date);
  if (date === '') {
    invalid.push("invalid date entry")
  }
  if (invalid.length > 0) {
    res.json({ "errors": invalid })
    return
  }
  try {
    console.log(id,description,duration,date);
    const savedExercise = await createAndSaveExercise(id,description,duration,date);
    res.json({ "username": userDetails.username, "description": description, "duration": duration, "date": date, "_id": user_id });
  } catch (err) {
    console.log("here");
    res.status(500).json({ error: 'Database error' })
  }
});

app.get("/api/users", async (req,res) => {
  try {
    const users = await returnAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
});

//////////////////////////////////////////////////////////////////////////////////////////

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
