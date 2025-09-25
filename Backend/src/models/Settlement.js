import mongoose from 'mongoose';

const SettlementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  groupId: {
    type: String,
    required: true,
    ref: 'Group'
  },
  groupName: {
    type: String,
    required: true
  },
  fromMember: {
    type: String,
    required: true
  },
  fromMemberName: {
    type: String,
    required: true
  },
  toMember: {
    type: String,
    required: true
  },
  toMemberName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  confirmed: {
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
SettlementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Following the Payment-Group Linkage Rule from memory
SettlementSchema.pre('save', function(next) {
  if (!this.groupId) {
    return next(new Error('Settlement must be linked to a group (Payment-Group Linkage Rule)'));
  }
  next();
});

// Index for faster queries
SettlementSchema.index({ groupId: 1 });
SettlementSchema.index({ fromMember: 1 });
SettlementSchema.index({ toMember: 1 });
SettlementSchema.index({ date: -1 });

export default mongoose.model('Settlement', SettlementSchema);