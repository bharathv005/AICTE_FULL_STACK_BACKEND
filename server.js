const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");
const Recipe = require("./models/Recipe");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Home Page API
app.get("/", (req, res) => {
    res.send("<h1 align=center>Welcome to the MERN stack week 2 session</h1>");
});

// User Registration API
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
        console.log("User Registration completed...");
    } catch (err) {
        console.error("Error in registration:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Login API
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        res.json({ message: "Login Successful", username: user.username });
    } catch (err) {
        console.error("Error in login:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Create a new recipe
app.post("/recipes", async (req, res) => {
    const { title, ingredients, instructions, imageUrl, userId } = req.body;

    try {
        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const newRecipe = new Recipe({
            title,
            ingredients,
            instructions,
            imageUrl,
            createdBy: new mongoose.Types.ObjectId(userId),
        });

        await newRecipe.save();
        res.status(201).json({ message: "Recipe created successfully", recipe: newRecipe });
    } catch (err) {
        console.error("Error creating recipe:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all recipes
app.get("/recipes", async (req, res) => {
    try {
        const recipes = await Recipe.find().populate("createdBy", "username email");
        res.json(recipes);
    } catch (err) {
        console.error("Error fetching recipes:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Save a recipe to a user's saved list
app.post("/recipes/save", async (req, res) => {
    const { userId, recipeId } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
            return res.status(400).json({ message: "Invalid User ID or Recipe ID" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.savedRecipes) user.savedRecipes = [];
        if (!user.savedRecipes.includes(recipeId)) {
            user.savedRecipes.push(new mongoose.Types.ObjectId(recipeId));
        }

        await user.save();
        res.json({ message: "Recipe saved successfully" });
    } catch (err) {
        console.error("Error saving recipe:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get a user's saved recipes
app.get("/recipes/saved/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        const user = await User.findById(userId).populate("savedRecipes");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.savedRecipes);
    } catch (err) {
        console.error("Error fetching saved recipes:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("DB connected successfully.."))
    .catch((err) => console.error("MongoDB connection error:", err));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
