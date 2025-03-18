import mongoose from 'mongoose';

export interface IFile extends mongoose.Document {
  name: string;
  type: string;
  size: number;
  url: string;
  owner: mongoose.Schema.Types.ObjectId;
  sharedWith: mongoose.Schema.Types.ObjectId[];
  group: mongoose.Schema.Types.ObjectId;
  department: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Por favor, adicione um tipo']
  },
  size: {
    type: Number,
    required: [true, 'Por favor, adicione um tamanho']
  },
  url: {
    type: String,
    required: [true, 'Por favor, adicione uma URL']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
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
FileSchema.pre<IFile>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual para obter a extensão do arquivo
FileSchema.virtual('extension').get(function() {
  return this.name.split('.').pop();
});

// Índices para melhorar a performance das consultas
FileSchema.index({ owner: 1 });
FileSchema.index({ sharedWith: 1 });
FileSchema.index({ group: 1 });
FileSchema.index({ department: 1 });
FileSchema.index({ name: 'text' });

export default mongoose.model<IFile>('File', FileSchema);