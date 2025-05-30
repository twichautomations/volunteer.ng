const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    userId: {
        type: Schema.Types.Mixed // Accepts number or string
    },
    image: {
        type: String
    },
    type: {
        type: String
    },
    duration: {
        type: String
    },
    heading: {
        type: String
    },
    orgName: {
        type: String
    },
    creatorId: {
        type: String
    },
    description: {
        type: String
    },
    category: {
        type: String
    },
    status: {
        type: String,
        enum: ["applied", "ongoing", "completed", "rejected"]
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
    requirements: {
        type: [String]
    },
    volunteers: {
        type: [String]
    },
    benefits: {
        type: [String]
    },
    contactEmail: {
        type: String
    },
    contactPhone: {
        type: String
    },
    maxVolunteers: {
        type: Number
    },
    tags: {
        type: [String]
    },
    createdAt: {
        type: String
    }
}, {
    timestamps: true,
    strict: false
});

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
