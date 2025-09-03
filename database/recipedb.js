const { Pool } = require('pg');

class RecipeDatabase {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    async init() {
        try {
            await this.createTables();
            console.log('Connected to PostgreSQL database');
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async createTables() {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            const createTablesSQL = `
                CREATE TABLE IF NOT EXISTS recipes (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    picture_path TEXT,
                    cooking_time INTEGER,
                    estimated_price REAL,
                    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS ingredients (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    unit TEXT
                );

                CREATE TABLE IF NOT EXISTS recipe_ingredients (
                    id SERIAL PRIMARY KEY,
                    recipe_id INTEGER NOT NULL,
                    ingredient_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    unit TEXT,
                    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
                    UNIQUE(recipe_id, ingredient_id)
                );

                CREATE TABLE IF NOT EXISTS recipe_steps (
                    id SERIAL PRIMARY KEY,
                    recipe_id INTEGER NOT NULL,
                    step_number INTEGER NOT NULL,
                    instruction TEXT NOT NULL,
                    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                    UNIQUE(recipe_id, step_number)
                );

                CREATE TABLE IF NOT EXISTS step_ingredients (
                    id SERIAL PRIMARY KEY,
                    step_id INTEGER NOT NULL,
                    ingredient_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    unit TEXT,
                    FOREIGN KEY (step_id) REFERENCES recipe_steps(id) ON DELETE CASCADE,
                    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
                    UNIQUE(step_id, ingredient_id)
                );

                CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
                CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
                CREATE INDEX IF NOT EXISTS idx_step_ingredients_step_id ON step_ingredients(step_id);
            `;

            await client.query(createTablesSQL);
            await client.query('COMMIT');
            console.log('Database tables created successfully');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async addRecipe(recipeData) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Insert recipe
            const recipeResult = await client.query(
                `INSERT INTO recipes (name, picture_path, cooking_time, estimated_price, rating) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [
                    recipeData.name,
                    recipeData.picture_path || null,
                    recipeData.cooking_time || null,
                    recipeData.estimated_price || null,
                    recipeData.rating || null
                ]
            );

            const recipeId = recipeResult.rows[0].id;

            // Add ingredients
            for (const ingredient of recipeData.ingredients) {
                // Insert or get ingredient
                let ingredientResult;
                try {
                    ingredientResult = await client.query(
                        'INSERT INTO ingredients (name, unit) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET unit = EXCLUDED.unit RETURNING id',
                        [ingredient.name, ingredient.unit || null]
                    );
                } catch (error) {
                    // If insert fails, try to get existing ingredient
                    ingredientResult = await client.query(
                        'SELECT id FROM ingredients WHERE name = $1',
                        [ingredient.name]
                    );
                }

                const ingredientId = ingredientResult.rows[0].id;

                // Link ingredient to recipe
                await client.query(
                    'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES ($1, $2, $3, $4)',
                    [recipeId, ingredientId, ingredient.amount, ingredient.unit]
                );
            }

            // Add steps
            for (const [index, step] of recipeData.steps.entries()) {
                const stepResult = await client.query(
                    'INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES ($1, $2, $3) RETURNING id',
                    [recipeId, index + 1, step.instruction]
                );
            }

            await client.query('COMMIT');
            return recipeId;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getRecipe(recipeId) {
        try {
            // Get recipe
            const recipeResult = await this.pool.query(
                'SELECT * FROM recipes WHERE id = $1',
                [recipeId]
            );

            if (recipeResult.rows.length === 0) {
                return null;
            }

            const recipe = recipeResult.rows[0];

            // Get ingredients
            const ingredientsResult = await this.pool.query(`
                SELECT i.name, ri.amount, COALESCE(ri.unit, i.unit) as unit
                FROM recipe_ingredients ri
                JOIN ingredients i ON ri.ingredient_id = i.id
                WHERE ri.recipe_id = $1
                ORDER BY i.name
            `, [recipeId]);

            // Get steps
            const stepsResult = await this.pool.query(`
                SELECT step_number, instruction
                FROM recipe_steps
                WHERE recipe_id = $1
                ORDER BY step_number
            `, [recipeId]);

            return {
                ...recipe,
                ingredients: ingredientsResult.rows,
                steps: stepsResult.rows
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllRecipes() {
        try {
            const result = await this.pool.query(`
                SELECT id, name, picture_path, cooking_time, estimated_price, rating, created_at
                FROM recipes
                ORDER BY created_at DESC
            `);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    async getAllRecipesWithDetails() {
        try {
            const result = await this.pool.query(`
                SELECT id, name, picture_path, cooking_time, estimated_price, rating, created_at
                FROM recipes
                ORDER BY created_at DESC
            `);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = RecipeDatabase;