import mongoose from 'mongoose';

const GroupMemberSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  }
}, { _id: false });

const GroupSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    required: true,
    default: 'from-blue-500 to-purple-600'
  },
  members: [GroupMemberSchema],
  createdBy: {
    type: String,
    required: true
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
GroupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ 'members.id': 1 });

export default mongoose.model('Group', GroupSchema);