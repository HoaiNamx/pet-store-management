const jwt = require('jsonwebtoken');
const { User } = require('../models');
const Joi = require('joi');

// Validation schemas
const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required(),
    fullName: Joi.string().max(100).optional(),
    role: Joi.string().valid('admin', 'staff').default('staff')
});

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

const authController = {
    // Login
    login: async (req, res) => {
        try {
            // Validate input
            const { error } = loginSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { username, password } = req.body;

            // Find user
            const user = await User.findOne({
                where: {
                    username,
                    isActive: true
                }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password'
                });
            }

            // Check password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password'
                });
            }

            // Generate token
            const token = generateToken(user);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: user.toJSON(),
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Register (for initial setup)
    register: async (req, res) => {
        try {
            // Validate input
            const { error } = registerSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { username, password, fullName, role } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                where: { username }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            // Create user
            const user = await User.create({
                username,
                password,
                fullName,
                role
            });

            // Generate token
            const token = generateToken(user);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: user.toJSON(),
                    token
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get current user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user.toJSON()
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Update profile
    updateProfile: async (req, res) => {
        try {
            const updateSchema = Joi.object({
                fullName: Joi.string().max(100).optional(),
                currentPassword: Joi.string().optional(),
                newPassword: Joi.string().min(6).optional()
            });

            const { error } = updateSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { fullName, currentPassword, newPassword } = req.body;

            const user = await User.findByPk(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update full name if provided
            if (fullName) {
                user.fullName = fullName;
            }

            // Update password if provided
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'Current password is required to change password'
                    });
                }

                const isValidPassword = await user.comparePassword(currentPassword);
                if (!isValidPassword) {
                    return res.status(401).json({
                        success: false,
                        message: 'Current password is incorrect'
                    });
                }

                user.password = newPassword;
            }

            await user.save();

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: user.toJSON()
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = authController;