const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
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
  date: {type: Date, required: false}
});

const User = mongoose.model('User',UsersSchema);
const Exercise = mongoose.model('Exercise',ExercisesSchema);

// enter username into db
const createAndSaveUser = async (username) => {
  const user = new User({ username: username });

  try {
    const savedUser = await user.save();
    console.log("user saved!!")
    return savedUser; 
  } catch (err) {
    console.log(err);
    throw err;
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
    console.log("valid");
    const savedUser = await createAndSaveUser(username);
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
});

//////////////////////////////////////////////////////////////////////////////////////////

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
