const mongoose = require('mongoose');
const Schema = mongoose.Schema


const leaderboardSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    googleId:  { type: String, required: true, unique: true },
    score: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, default: Date.now },
    profilePicture: {
        type: String
    },
});

// Index for faster ranking queries
leaderboardSchema.index({ score: -1 });

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

module.exports = Leaderboard;