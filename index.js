const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('./model/User');
const path = require('path');
const MongoStore = require('connect-mongo');

dotenv.config();
mongoose.connect('mongodb+srv://twichautomations:weautomate@cluster0.lp2jztg.mongodb.net/volunteerng');




const cors = require("cors");


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
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(express.static(path.join(__dirname, 'cyber')));

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.json()); 


// Session Middleware
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//       cookie: {
//         secure: process.env.NODE_ENV === 'production', // Only true in production
//         httpOnly: true,
//         maxAge: 24 * 60 * 60 * 1000 // 1-day expiration
//     }
// }));

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
        });
        await user.save();
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
            res.redirect('https://volunteerng.vercel.app/join');
        });
    }
);


// Logout Route
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.sendFile(path.join(__dirname, 'cyber', 'index.html'));
    });
});

// Dashboard (Protected)
app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send('Unauthorized');
    }

     res.json({
        "message": "Welcome!"
    });// Sends "Works" as a response
    // ... serve dashboard content
});



app.get('/user_data', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ userId: req.user.googleId });
});


app.get('/userid', async (req, res) => {
    try {
        // If using authentication, uncomment the lines below
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Log the user object from the session (for debugging)
        console.log("Session User:", req.user);

        // Make sure req.user exists
        if (!req.user) {
            return res.status(404).json({ error: 'No user in session' });
        }

        // Extract and send the user ID (adjust key if different)
        const userId = req.user._id || req.user.id;

        return res.json({ userId });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});





  

app.get('/user', async (req, res) => {
    // if (!req.isAuthenticated()) {
    //     return res.status(401).json({ error: 'User not authenticated' });
    // }
    console.log("Session User:", req.user);

    let user = await User.findOne({ googleId: req.user.googleId });
    

    // console.log(req.user.id);
    // console.log( req.user.emails[0].value);
    // console.log(req.user.photos[0]);

    console.log("User is",user);
    
    res.json({
        id: user.googleId,
        displayName: user.displayName,
        email: user.contactEmail,
        
        
    });
});





// Endpoint to receive and save userType
app.post('/save-user-type', (req, res) => {
    const { userType } = req.body;

    if (!userType) {
        return res.status(400).json({ message: 'userType is required' });
    }

    // Save to in-memory array
    users.push({ id: users.length + 1, userType });

    return res.status(201).json({
        message: 'User type saved successfully',
        data: { id: users.length, userType }
    });
});










app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
