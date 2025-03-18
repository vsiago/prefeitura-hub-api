import mongoose from 'mongoose';

export interface IGroupMember extends mongoose.Document {
  group: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  role: string;
  joinedAt: Date;
}

const GroupMemberSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// Garantir que um usuário só pode ser membro de um grupo uma vez
GroupMemberSchema.index({ group: 1, user: 1 }, { unique: true });

export default mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);