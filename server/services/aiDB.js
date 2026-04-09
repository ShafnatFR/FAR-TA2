
const db = require('../db');

/**
 * Get user's AI subscription status and basic details
 */
const getUserAISubscription = async (userId) => {
    const [rows] = await db.query(
        'SELECT ai_subscription_status, role FROM users WHERE id = ?', 
        [userId]
    );
    return rows[0] || null;
};

/**
 * Get all API keys for a specific user
 */
const getUserAIKeys = async (userId) => {
    const [rows] = await db.query(
        'SELECT api_key, label FROM user_ai_keys WHERE user_id = ?', 
        [userId]
    );
    return rows;
};

/**
 * Save AI generation results to history (Optional but recommended)
 */
const saveAIGeneration = async (userId, action, prompt, result) => {
    try {
        await db.query(
            'INSERT INTO corporate_ai_generations (donor_id, action_type, prompt_text, result_json) VALUES (?, ?, ?, ?)',
            [userId, action, prompt, JSON.stringify(result)]
        );
    } catch (err) {
        console.error('[aiDB] Failed to save generation history:', err);
    }
};

module.exports = {
    getUserAISubscription,
    getUserAIKeys,
    saveAIGeneration
};
