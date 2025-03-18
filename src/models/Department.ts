import mongoose from 'mongoose';

export interface IDepartment extends mongoose.Document {
  name: string;
  description: string;
  head: mongoose.Schema.Types.ObjectId;
  parent: mongoose.Schema.Types.ObjectId;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    unique: true,
    trim: true,
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, adicione uma descrição']
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  color: {
    type: String,
    default: '#3788d8'
  },
  icon: {
    type: String,
    default: 'building'
  },
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
DepartmentSchema.pre<IDepartment>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual para obter departamentos filhos
DepartmentSchema.virtual('children', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

// Índices para melhorar a performance das consultas
DepartmentSchema.index({ name: 'text' });
DepartmentSchema.index({ parent: 1 });

export default mongoose.model<IDepartment>('Department', DepartmentSchema);