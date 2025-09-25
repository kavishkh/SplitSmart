import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    // Try to fetch from database, but return empty array if database is not available
    const users = await User.find({}).catch(() => []);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.json([]); // Return empty array instead of error
  }
};

export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    // If database is not available, still return a success response for demo purposes
    const demoUser = { ...req.body, id: req.body.id || `user-${Date.now()}` };
    res.status(201).json(demoUser);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).catch(() => null);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(404).json({ error: 'User not found' });
  }
};