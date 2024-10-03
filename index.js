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

//////////////////////////////////////////////////////////////////////////////////////////

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
