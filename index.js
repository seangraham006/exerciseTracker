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

const findExercisesByUserId = async (id) => {
  console.log("findExercisesByUser:",id);
  try {
    const exercises = await Exercise.find({user_id: id});
    return exercises
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

const convertToReadableDate = (isoDateString) => {
  const date = new Date(isoDateString);
  return date.toDateString();
};

const extractKeys = (array, keys) => {
  return array.map(item => {
    let extracted = {};
    keys.forEach(key => {
      extracted[key] = item[key]
    });
    return extracted;
  });
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
  const { _id: id } = req.params;
  const { description, duration } = req.body;
  let { date } = req.body;
  //is id real
  try {
    const userDetails = await findUserById(id);
    if (!userDetails) {
      return res.status(400).json({ error: "invalid user id" });
    };

    if (!description || description.trim() === '') {
      return res.status(400).json({ error: "invalid description" });
    };

    const durationNumber = Number(duration);
    if (isNaN(durationNumber) || durationNumber <= 0) {
      return res.status(400).json({ error: "duration must be a positive integer" });
    };

    const validDate = isValidDateFormat(date);
    if (validDate === '') {
      return res.status(400).json({ error: "invalid date entry" });
    };
    const readableDate = convertToReadableDate(validDate);
  
    const savedExercise = await createAndSaveExercise(id,description,durationNumber,readableDate);
    res.json({ "username": userDetails.username, "description": description, "duration": durationNumber, "date": readableDate, "_id": userDetails._id });
  } catch (err) {
    console.log(err);
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

app.get('/api/users/:_id/logs', async (req,res) => {
  const { _id: id } = req.params;
  try {
    const userDetails = await findUserById(id);
    if (!userDetails) {
      return res.status(400).json({ error: "invalid user id" });
    };

    const exercises = await findExercisesByUserId(id);
    const count = exercises.length;
    const desiredFields = ['description','duration','date'];

    const coreExerciseValues = extractKeys(exercises,desiredFields);
    console.log(coreExerciseValues);

    res.json({ "username": userDetails.username, "count": count, "_id": userDetails._id, "log": coreExerciseValues });
    console.log("res shown")
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Database error' })
  }
});

//////////////////////////////////////////////////////////////////////////////////////////

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
