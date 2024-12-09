require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const User = require('./models/user');
const Exercise = require('./models/exercise');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useCreateIndex: true 
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    const savedUser = await user.save();
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users.map(user => ({
      username: user.username,
      _id: user._id
    })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add an exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) throw new Error('User not found');

    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date ? new Date(req.body.date) : new Date()
    });

    await exercise.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) throw new Error('User not found');

    let query = { userId: user._id };

    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) {
        query.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        query.date.$lte = new Date(req.query.to);
      }
    }

    let exercises = await Exercise.find(query);

    if (req.query.limit) {
      exercises = exercises.slice(0, Number(req.query.limit));
    }

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }))
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
