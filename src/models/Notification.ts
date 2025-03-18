import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  recipient: mongoose.Schema.Types.ObjectId;
  type: string;
  content: string;
  relatedTo: {
    type: string;
    id: mongoose.Schema.Types.ObjectId;
  };
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['post', 'comment', 'like', 'message', 'event', 'group', 'file', 'news', 'system'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Por favor, adicione um conteúdo']
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['post', 'comment', 'chat', 'event', 'group', 'file', 'news', 'user'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'relatedTo.type'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para melhorar a performance das consultas
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);