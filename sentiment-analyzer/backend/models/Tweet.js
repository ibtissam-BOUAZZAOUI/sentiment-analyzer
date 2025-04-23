const mongoose = require("mongoose");

const tweetSchema = new mongoose.Schema({
  tweetId: { type: String, required: true },
  text: { type: String, required: true },
  
});

const Tweet = mongoose.model("Tweet", tweetSchema);

module.exports = Tweet;
