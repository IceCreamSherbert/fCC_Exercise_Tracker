const mongoose = require("mongoose");

// Schemas
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
})

// Models
let User = mongoose.model("User", userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = { User, Exercise };
