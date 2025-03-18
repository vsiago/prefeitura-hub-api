import mongoose from 'mongoose';

export interface IChat extends mongoose.Document {
  participants: mongoose.Schema.Types.ObjectId[];
  isGroup: boolean;
  name: string;
  lastMessage: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  ],
  isGroup: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: function() { return this.isGroup; }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
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

// Middleware para atualizar o campo updatedAt antes de salvar
ChatSchema.pre<IChat>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índices para melhorar a performance das consultas
ChatSchema.index({ participants: 1 });
ChatSchema.index({ updatedAt: -1 });

export default mongoose.model<IChat>('Chat', ChatSchema);