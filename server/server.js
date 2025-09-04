
require('dotenv').config();

console.log('Environment variables check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL value:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const RecipeDatabase = require('./recipedb');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
const db = new RecipeDatabase();
let isDatabaseInitialized = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
        console.error('Failed to create uploads directory:', error);
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `recipe-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper function to check database connection
const checkDatabaseConnection = (res) => {
    if (!isDatabaseInitialized) {
        res.status(503).json({ error: 'Database not available' });
        return false;
    }
    return true;
};

// API Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
    if (!isDatabaseInitialized) {
        return res.status(503).json({ status: 'Database not initialized' });
    }
    res.json({ status: 'OK', database: 'Connected' });
});

// GET /api/recipes - Get all recipes
app.get('/api/recipes', async (req, res) => {
    if (!checkDatabaseConnection(res)) return;
    
    try {
        const recipes = await db.getAllRecipes();
        res.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// GET /api/recipes/:id - Get single recipe
app.get('/api/recipes/:id', async (req, res) => {
    if (!checkDatabaseConnection(res)) return;
    
    try {
        const recipe = await db.getRecipe(req.params.id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.json(recipe);
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

// POST /api/recipes - Add new recipe
app.post('/api/recipes', upload.single('picture'), async (req, res) => {
    if (!checkDatabaseConnection(res)) return;
    
    try {
        const { name, ingredients, steps, cooking_time, estimated_price, rating } = req.body;

        // Validate required fields
        if (!name || !ingredients || !steps) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, ingredients, and steps' 
            });
        }

        // Parse JSON strings
        let parsedIngredients, parsedSteps;
        try {
            parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
            parsedSteps = typeof steps === 'string' ? JSON.parse(steps) : steps;
        } catch (parseError) {
            return res.status(400).json({ error: 'Invalid JSON format for ingredients or steps' });
        }

        // Validate rating if provided
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const recipeData = {
            name: name.trim(),
            picture_path: req.file ? `/uploads/${req.file.filename}` : null,
            cooking_time: cooking_time ? parseInt(cooking_time) : null,
            estimated_price: estimated_price ? parseFloat(estimated_price) : null,
            rating: rating ? parseInt(rating) : null,
            ingredients: parsedIngredients.map(ingredient => ({
                name: ingredient.name.trim(),
                amount: parseFloat(ingredient.amount),
                unit: ingredient.unit.trim()
            })),
            steps: parsedSteps.map((step, index) => ({
                number: index + 1,
                instruction: step.instruction.trim()
            }))
        };

        const recipeId = await db.addRecipe(recipeData);
        res.status(201).json({ 
            message: 'Recipe added successfully', 
            id: recipeId 
        });

    } catch (error) {
        console.error('Error adding recipe:', error);
        res.status(500).json({ error: 'Failed to add recipe' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
    await ensureUploadsDir();
    
    try {
        // Initialize database
        await db.init();
        isDatabaseInitialized = true;
        console.log('Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer().catch(console.error);

module.exports = app;