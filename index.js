const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('./model/User');
const Project = require('./model/Project');
const path = require('path');
const MongoStore = require('connect-mongo');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');








dotenv.config();
mongoose.connect('mongodb+srv://twichautomations:weautomate@cluster0.lp2jztg.mongodb.net/volunteerng');




const cors = require("cors");
const { request } = require('http');


// Enable CORS


const db = mongoose.connection;

db.on('error', (err) => {
    console.log(err);
});

db.once('open', () => {
    console.log("Database Connection Established Succesfully");
});




const app = express();

app.use(cors({
    origin: true, // Allow all origins dynamically
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", 'userId']
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});



app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.json()); 

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'project_uploads', // optional folder in Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
  });
  
  const upload = multer({ storage });
  

app.use(session({
  secret: process.env.SESSION_SECRET, // Replace with your own secret
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Your MongoDB connection string
    ttl: 14 * 24 * 60 * 60, // Session expiration time in seconds (14 days)
    autoRemove: 'native' // Automatically remove expired sessions
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // Cookie expiration time in milliseconds (14 days)
    secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
    httpOnly: true
  }
}));

app.set('trust proxy', 1);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
 // <-- This is needed to parse JSON requests








// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://volunteer-ng.onrender.com/auth/google_callback"
}, async (accessToken, refreshToken, profile, done) => {
    // console.log("Google Profile Data:", profile); 
    // Check if user exists in DB

    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
        user = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            contactEmail: profile.emails[0].value,
            image: profile.photos[0].value,
          role: "",
           phone : "",
           industry : "",
           experience : "",
           school : "",
           company : "",
         
        });
        await user.save();
    }
    else{

    }
   

    return done(null, user);
}));

passport.serializeUser((user, done) => {
    console.log("Serializing user:", user); // Debugging
    done(null, user.googleId);  // Store googleId, NOT _id
});

passport.deserializeUser(async (googleId, done) => {
    console.log("Deserializing user with googleId:", googleId); // Debugging
    try {
        const user = await User.findOne({ googleId });
        if (!user) {
            console.log("User not found in database.");
            return done(null, false);
        }
        console.log("User found:", user);
        done(null, user);
    } catch (err) {
        console.error("Error in deserialization:", err);
        done(err);
    }
});






// Google Auth Route
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Callback Route
app.get("/auth/google_callback",
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        req.session.save(() => {
            res.redirect('/dashboard');
        });
    }
);


// Logout Route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Error during logout" });
        }

        req.session.destroy((err) => {
            if (err) {
                console.error("Session destruction error:", err);
            }

            // ✅ Return JSON success response
            res.status(200).json({ message: "Logged out successfully" });
        });
    });
});



// Dashboard (Protected)
app.get('/dashboard', async (req, res) => {
    try{

    
    if (!req.isAuthenticated()) {
        return res.status(401).send('Unauthorized');
    }
    const userId = req.user.googleId;

    let user = await User.findOne({ googleId:userId});

    if (!user.role || user.role === '') {
      console.log("User has not registred at all");
        return res.redirect(`https://volunteerng.vercel.app/join?userId=${user.googleId}`);
    }
    else if ( user.role == "volunteer"  && user.phone === ""){
      console.log("user has started registration but not completed");
        return res.redirect(`https://volunteerng.vercel.app/onboarding/volunteer?userId=${user.googleId}`);
    }
    
    else if ( user.role == "organization" && user.industry === ""){
      console.log("user has started registration but not completed");
        return res.redirect(`https://volunteerng.vercel.app/onboarding/org?userId=${user.googleId}`);
    }
    else if ( user.role == "volunteer" && user.industry != ""){
      console.log("user has started registration and completed");
      return res.redirect(`https://volunteerng.vercel.app/project/volunteer?userId=${user.googleId}`);
  }

  else if ( user.role == "organization" && user.industry != ""){
    console.log("user has started registration and completed");
    return res.redirect(`https://volunteerng.vercel.app/project/organization?userId=${user.googleId}`);
}
    // res.redirect(`https://volunteerng.vercel.app/join?userId=${userId}`);
}
catch (error) {
    console.error("Error in /dashboard", error);
    res.status(500).json({ message: "Internal server error" });
}
});










app.get('/user', async (req, res) => {
    try {
        const userId = req.headers['userid']; // GET requests usually don't use body
        // const userId = req.query.userId; // better practice: use query params for GET
        console.log(req.headers);

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId in request' });
        }

        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log("User is", user);

        res.json({
         
            displayName: user.displayName,
            email: user.contactEmail,
            image: user.image,
            role: user.role,
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});






app.post('/save-user-type', async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ message: "Missing userId or role in request body" });
        }

        // Find user by Google ID
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user's role
        user.role = role;
        await user.save();

        res.status(200).json({ message: "User role updated successfully!", status:"true" });
    } catch (error) {
        console.error("Error in /save-user-type:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/save-user-data', async (req, res) => {
    try {
        // const { userId } = req.body;
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: "Missing userId in request body" });
        }

        // Find user by Google ID
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userRole = user.role || "Not set";

        if( userRole == "volunteer"){
            // const { displayName, phone, industry, experience, school, company, sosecGraduate } = req.body;

            user.displayName = req.body.volunteer.displayName;
            user.phone = req.body.volunteer.phone;
            user.industry = req.body.volunteer.industry;
            user.experience = req.body.volunteer.experience;
            user.school = req.body.volunteer.school;
            user.company = req.body.volunteer.company;
            user.skills = req.body.volunteer.skills;
            user.sosec = req.body.volunteer.sosec;
            
            console.log ("I AM HERE ");
            await user.save();
        }

        if( userRole == "organization"){
            // const { displayName, phone, industry, experience, school, company, sosecGraduate } = req.body;

            user.displayName = req.body.organization.displayName;
            user.phoneNumber = req.body.organization.phoneNumber;
            user.address = req.body.organization.address;
            user.description = req.body.organization.description;
            user.school = req.body.organization.school;
            user.website = req.body.organization.website;
            user.socialMedia = req.body.organization.socialMedia;
            user.industry = req.body.organization.industry;
            user.organizationType = req.body.organization.organizationType;
            
            console.log ("I AM organisation ");
            await user.save();
        }
       
        console.log(`User ${user.googleId} has role: ${userRole}`);

        res.status(200).json({
            message: "User data saved successfully!",
            role: userRole,
            status: "true"
        });
    } catch (error) {
        console.error("Error in /save-user-data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



app.post('/save-project-data',  async (req, res) => {
    try {
        // if (!req.body.heading || !req.body.orgName || !req.body.status) {
        //     return res.status(400).json({ message: "Missing required fields: heading, orgName, or status" });
        // }

        const project = new Project();

        project.creatorId = req.body.userId;
        project.image = req.body.image;
        project.type = req.body.type;
        project.public_id = req.body.public_id;
        project.duration = req.body.duration;
        project.heading = req.body.heading;
        project.orgName = req.body.orgName;
        project.description = req.body.description;
        project.causes = req.body.causes;
        project.status = req.body.status;
        project.location = req.body.location;
        project.startDate = req.body.startDate;
        project.endDate = req.body.endDate;
        project.requirements = req.body.requirements;
        project.benefits = req.body.benefits;
        project.duration = req.body.duration;
        project.contactEmail = req.body.contactEmail;
        project.contactPhone = req.body.contactPhone;
        project.maxVolunteers = req.body.maxVolunteers;
        project.tags = req.body.tags;
        project.canApply = true;
        project.createdAt = req.body.createdAt;

        console.log("Saving project:", project);

        await project.save();

        return res.status(201).json({
            message: "Project saved successfully",
            project: project
        });

    } catch (error) {
        console.error("Error saving project:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});





app.get('/projects', async (req, res) => {
  try {
    const {
      cause,        // maps to project.category
      skills,       // maps to project.tags
      type,         // maps to project.type
      location,     // maps to project.location
      userId,       // maps to project.creatorId
      page = 1,
      limit = 10
    } = req.query;

    // Create the MongoDB query object
    const query = {};

    if (userId) {
      query.creatorId = userId;
    }

    if (cause) {
      query.cause = { $in: cause.split(',') };
    }

    if (skills) {
      query.skills = { $in: skills.split(',') };
    }

    if (type) {
      query.type = { $in: type.split(',') };
    }

    if (location) {
      query.location = { $in: location.split(',') };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const projects = await Project.find(query)
      .skip(skip)
      .limit(limitNum);

    const total = await Project.countDocuments(query);
    

    res.status(200).json({
      total,
      page: pageNum,
      limit: limitNum,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
});



app.delete('/delete-project/:userId/:projectId', async (req, res) => {
    const { userId, projectId } = req.params;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
  
      const project = await Project.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        creatorId: userId,
      });
  
      if (!project) {
        return res.status(403).json({ message: 'Unauthorized or project not found' });
      }
  
      // Delete image from Cloudinary if public_id is stored
      if (project.public_id) {
        await cloudinary.uploader.destroy(project.public_id);
      }
  
      // Then delete the project
      await Project.deleteOne({ _id: projectId });
  
      res.status(200).json({ message: 'Project and image deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const userId = req.query.userId;
  
    try {
      // Validate projectId
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID format' });
      }
  
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      // Default response
      let responsePayload = { project };
  
      // If requester is the creator, attach volunteer info
      if (userId && project.creatorId === userId && project.volunteersJoined?.length > 0) {
        const volunteers = await User.find({
          googleId: { $in: project.volunteersJoined },
        });
  
        responsePayload.volunteers = volunteers;
      }
  
      res.status(200).json(responsePayload);
  
    } catch (err) {
      console.error('Error fetching project:', err);
      res.status(500).json({ message: 'Server error while fetching project' });
    }
  });
  


  //edit or update a project

  app.put('/update-project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const {
      
      image,
      type,
      duration,
      heading,
      orgName,
      description,
      causes,
      status,
      location,
      startDate,
      endDate,
      requirements,
      benefits,
      contactEmail,
      contactPhone,
      maxVolunteers,
      tags
    } = req.body;
  const userId = req.body.userId;
    try {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID format' });
      }
  
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      // Check if the user is the creator
      if (project.creatorId != userId) {
        return res.status(403).json({ message: 'Unauthorized to edit this project' });
      }

      const hasVolunteers = project.volunteers && project.volunteers.length > 0;

      if (hasVolunteers) {
        return res.status(403).json({ message: 'Cannot edit project: Volunteers have already joined' });
      }
  
      // Apply updates with fallback to current values
      project.image = image || project.image;
      project.type = type || project.type;
      project.duration = duration || project.duration;
      project.heading = heading || project.heading;
      project.orgName = orgName || project.orgName;
      project.description = description || project.description;
      project.causes = causes || project.causes;
      project.status = status || project.status;
      project.location = location || project.location;
      project.startDate = startDate || project.startDate;
      project.duration = duration || project.duration;
      project.endDate = endDate || project.endDate;
      project.requirements = requirements || project.requirements;
      project.benefits = benefits || project.benefits;
      project.contactEmail = contactEmail || project.contactEmail;
      project.contactPhone = contactPhone || project.contactPhone;
      project.maxVolunteers = maxVolunteers || project.maxVolunteers;
      project.tags = tags || project.tags;
  
      await project.save();
  
      res.status(200).json({
        message: 'Project updated successfully',
        project
      });
  
    } catch (err) {
      console.error('Error updating project:', err);
      res.status(500).json({ message: 'Server error while updating project' });
    }
  });

  app.post('/join-project', async (req, res) => {
    const { userId, projectId } = req.body;
  
    if (!userId || !projectId) {
      return res.status(400).json({ message: 'userId and projectId are required.' });
    }
  
    try {
      const user = await User.findOne({ googleId: userId });
      const project = await Project.findById(projectId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }
  
      // Check if project is full
      if (project.volunteersJoined.length >= project.maxVolunteers) {
        return res.status(403).json({ message: 'Volunteer limit reached for this project.' });
      }
  
      // Add userId to project's volunteersJoined if not already included
      if (!project.volunteersJoined.includes(userId)) {
        project.volunteersJoined.push(userId);
  
        // If full after adding, set canApply to false
        if (project.volunteersJoined.length >= project.maxVolunteers) {
          project.canApply = false;
        }
  
        await project.save();
      }
  
      // Add projectId to user's projectsJoined if not already included
      if (!user.projectsJoined.includes(projectId)) {
        user.projectsJoined.push(projectId);
        await user.save();
      }
  
      res.status(200).json({
        message: 'User successfully joined the project.',
        project,
        user
      });
  
    } catch (error) {
      console.error('Error joining project:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  



app.post('/leave-project', async (req, res) => {
  
  const userId = req.body.userId;
  const projectId = req.body.projectId;

  const project = await Project.findById(projectId);


  if (!userId || !projectId) {
    return res.status(400).json({ message: 'userId and projectId are required.' });
  }
  if (!project) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  try {
  const user = await User.findOne({ googleId: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Avoid duplicates
    if (user.projectsJoined.includes(projectId)) {
      user.projectsJoined.pull(projectId);
      await user.save();
    }

          // Add userId to project's volunteersJoined if not already included
          if (project.volunteersJoined.includes(userId)) {
            project.volunteersJoined.pull(userId);
      
            // If full after adding, set canApply to false
            if (project.volunteersJoined.length < project.maxVolunteers) {
              project.canApply = true;
            }
      
            await project.save();
          }

    res.status(200).json({ message: 'Project exited  successfully.', user });
  } catch (error) {
    console.error('Error exiting project:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.get('/user-joined-projects', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId in query" });
  }

  try {
    // Find the user by Google ID
    const user = await User.findOne({ googleId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const projectIds = user.projectsJoined || [];

    if (projectIds.length === 0) {
      return res.status(200).json({ projects: [] });
    }

    // Fetch projects where _id is in the user's projectsJoined array
    const projects = await Project.find({
      _id: { $in: projectIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching joined projects:", error);
    res.status(500).json({ message: "Server error while fetching joined projects" });
  }
});
  

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
