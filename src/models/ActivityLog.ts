import mongoose from 'mongoose';

export interface IActivityLog extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  action: string;
  entity: {
    type: string;
    id: mongoose.Schema.Types.ObjectId;
  };
  details: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'view', 'download', 'upload', 'share', 'other'],
    required: true
  },
  entity: {
    type: {
      type: String,
      enum: ['user', 'post', 'comment', 'group', 'chat', 'message', 'event', 'news', 'file', 'department', 'system'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entity.type'
    }
  },
  details: {
    type: String
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para melhorar a performance das consultas
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ 'entity.type': 1, 'entity.id': 1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);