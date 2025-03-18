import mongoose from 'mongoose';

export interface IQuickAccess extends mongoose.Document {
  name: string;
  icon: string;
  url: string;
  category: string;
  user: mongoose.Schema.Types.ObjectId;
  order: number;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuickAccessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    trim: true,
    maxlength: [30, 'Nome não pode ter mais de 30 caracteres']
  },
  icon: {
    type: String,
    required: [true, 'Por favor, adicione um ícone'],
    default: 'link'
  },
  url: {
    type: String,
    required: [true, 'Por favor, adicione uma URL']
  },
  category: {
    type: String,
    default: 'Outros'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isCustom: {
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

// Middleware para atualizar o campo updatedAt antes de salvar
QuickAccessSchema.pre<IQuickAccess>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índices para melhorar a performance das consultas
QuickAccessSchema.index({ user: 1, order: 1 });
QuickAccessSchema.index({ category: 1 });

export default mongoose.model<IQuickAccess>('QuickAccess', QuickAccessSchema);