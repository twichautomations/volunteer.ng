const mongoose = require('mongoose');
const Schema = mongoose.Schema


const UserSchema = new Schema({
    displayName: {
        type: String
    },
    
    skills: {
        type: [String]
    },
    
    websiteURL: {
        type: String
    },
      school: {
        type: String
    },
    company: {
        type: String
    },
    experience: {
        type: String
    },
    industry: {
        type: String
    },
    phone: {
        type: String
    },
    googleId: {
        type: String
    },
   email: {
        type: String
    },
    role: {
        type: String
    },
    heading: {
        type: String
    },
    // orgName: {
    //     type: String
    // },
    description: {
        type: String
    },
    category: {
        type: String
    },
    status: {
        type: String
    },
    location: {
        type: String
    },
    startDate: {
        type: String
    },
    endDate: {
        type: String
    },
    sosecGraduate: {
        type: String
    },
    requirements: {
        type: [String],
    },
    benefits: {
        type: String
    },
    maxVolunteers: {
        type: String
    },
    tags: {
        type: String
    },
    email: {
        type: String
    },
    image: {
        type: String
    },
    favorites: [{
        type: String  // Store product IDs as strings
    }]
}, {timestamps:true,
    strict: false
}
);


const User = mongoose.model('User', UserSchema);
module.exports = User