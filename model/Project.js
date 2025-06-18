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
    volunteersJoined: [
        {
          userId: { type: String, required: true }, // store as string if you're using googleId or ObjectId as string
          name: String,
          email: String,
          phone: String,
          project: String, // projectId
          qualifications: String,
          experience: String,
          skills: String,
          availability: String,
          message: String
        }
      ],
    canApply:{
        type:Boolean
    },
    duration: {
        type: String
    },
    public_id: {
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
    causes: {
        type: [String]
    },
    status: {
        type: String,
        // enum: ["published", "ongoing", "completed"]
    },
    location: {
        type: [String]
    },
    duration: {
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
    benefits: {
        type: [String]
    },
    skills: {
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
    createdAt: {
        type: String
    }
}, {
    timestamps: true,
    strict: false
});

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
