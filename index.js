const express = require("express")
const mongoose = require("mongoose")
const cors = require('cors')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const multer = require("multer");
const path = require("path");
const userModel = require("./Model/User")
const Incident = require("./Model/Incident");
const PORT = process.env.PORT || 3000;
dotenv.config();
const app = express()
app.use(express.json())
app.use(cors({ origin: "*" }))
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


mongoose.connect(process.env.MONGO_URI).then(() => {

    console.log("connected to mongodb");
   
    
}).catch((err) => {
    console.log("failed to connectmongodb error" ,err);
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });


// ----------signUp

app.post("/signup",  async (req,res) => {
    try{
        const {name,email,password} = req.body;
        console.log(name + " " + email + " " + password)
        const existingUser = await userModel.findOne({email});
        console.log(existingUser)
        if (existingUser) {
        return res.status(400).json({error: "Email already exists"});
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new userModel({name, email,password:hashedPassword});
    const savedUser = await newUser.save();
    res.status(201).json(savedUser)
    } catch (error) {
        res.status(500).json({error:error.message})
     }
    

})


//login

    app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: "No records found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Password does not match" });
        }

        // Send userId along with success message
        res.json({ success: true, message: "Login successful", userId: user._id });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});









//reportIncident


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage });

app.post("/report", upload.single("image"), async (req, res) => {
    try {
        const { title, category, description, location, latitude, longitude, reporter, reporterId } = req.body;

        if (!title || !description || !category || !location || !latitude || !longitude || !reporter || !reporterId) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // const image = req.file ? `/uploads/${req.file.filename}` : null;

        const image = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;


        const newIncident = new Incident({ title, category, description, location, latitude, longitude, reporter,reporterId, image });
        await newIncident.save();

        res.status(201).json({ success: true, message: "Incident reported successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});



// -----------------get incients

app.get("/incidents", async (req, res) => {
    try {
        const { category } = req.query; // Get category from request query
        let incidents;

        if (category && category !== "All") {
            incidents = await Incident.find({ category });
        } else {
            incidents = await Incident.find();
        }

        res.status(200).json(incidents);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});






//   incident details


app.get("/incidents/:id", async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }
        res.json(incident);
    } catch (error) {
        res.status(500).json({ message: "Error fetching incident", error });
    }
});





app.get("/api/user/profile/:userId", async (req, res) => {
    try {
        const user = await userModel.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});





app.get("/incidents/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const userIncidents = await Incident.find({ reporterId: userId });

        if (!userIncidents || userIncidents.length === 0) {
            return res.status(404).json({ message: "No incidents found for this user" });
        }

        res.status(200).json(userIncidents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user incidents", error });
    }
});




// console.log("Current Image State:", incident.image);
