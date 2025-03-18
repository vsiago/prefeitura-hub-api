import mongoose from 'mongoose';

export interface IGroup extends mongoose.Document {
  name: string;
  description: string;
  creator: mongoose.Schema.Types.ObjectId;
  avatar: string;
  cover: string;
  isPrivate: boolean;
  members: mongoose.Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    trim: true,
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, adicione uma descrição'],
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  avatar: {
    type: String,
    default: '/uploads/groups/default.png'
  },
  cover: {
    type: String,
    default: '/uploads/groups/cover-default.png'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMember'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware para atualizar o campo updatedAt antes de salvar
GroupSchema.pre<IGroup>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual para contar membros
GroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Índices para melhorar a performance das consultas
GroupSchema.index({ name: 'text', description: 'text' });
GroupSchema.index({ creator: 1 });
GroupSchema.index({ isPrivate: 1 });

export default mongoose.model<IGroup>('Group', GroupSchema);