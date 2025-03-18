import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
  chat: mongoose.Schema.Types.ObjectId;
  sender: mongoose.Schema.Types.ObjectId;
  content: string;
  media: string[];
  readBy: mongoose.Schema.Types.ObjectId[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() { return this.media.length === 0; }
  },
  media: [
    {
      type: String
    }
  ],
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  isEdited: {
    type: Boolean,
    default: false
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
MessageSchema.pre<IMessage>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual para verificar se a mensagem foi lida por todos
MessageSchema.virtual('isReadByAll').get(function() {
  // Obter todos os participantes do chat (implementar lógica)
  // Comparar com readBy
  return false;
});

// Índices para melhorar a performance das consultas
MessageSchema.index({ chat: 1, createdAt: 1 });
MessageSchema.index({ sender: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);