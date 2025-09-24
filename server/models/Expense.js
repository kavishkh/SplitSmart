import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'transport', 'entertainment', 'utilities', 'shopping', 'other']
  },
  groupId: {
    type: String,
    required: true,
    ref: 'Group'
  },
  paidBy: {
    type: String,
    required: true
  },
  splitBetween: [{
    type: String,
    required: true
  }],
  createdBy: {
    type: String,
    required: true
  },
  settled: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
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
ExpenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Following the Payment-Group Linkage Rule from memory
ExpenseSchema.pre('save', function(next) {
  if (!this.groupId) {
    return next(new Error('Expense must be linked to a group (Payment-Group Linkage Rule)'));
  }
  next();
});

// Index for faster queries
ExpenseSchema.index({ groupId: 1 });
ExpenseSchema.index({ paidBy: 1 });
ExpenseSchema.index({ createdBy: 1 });
ExpenseSchema.index({ date: -1 });

export default mongoose.model('Expense', ExpenseSchema);