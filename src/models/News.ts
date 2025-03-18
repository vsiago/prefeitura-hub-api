import mongoose from 'mongoose';

export interface INews extends mongoose.Document {
  title: string;
  content: string;
  summary: string;
  author: mongoose.Schema.Types.ObjectId;
  media: string[];
  category: string;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  publishDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [200, 'Título não pode ter mais de 200 caracteres']
  },
  content: {
    type: String,
    required: [true, 'Por favor, adicione um conteúdo']
  },
  summary: {
    type: String,
    required: [true, 'Por favor, adicione um resumo'],
    maxlength: [500, 'Resumo não pode ter mais de 500 caracteres']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: [
    {
      type: String
    }
  ],
  category: {
    type: String,
    required: [true, 'Por favor, adicione uma categoria']
  },
  tags: [
    {
      type: String
    }
  ],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishDate: {
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

// Middleware para atualizar o campo updatedAt antes de salvar
NewsSchema.pre<INews>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índices para melhorar a performance das consultas
NewsSchema.index({ title: 'text', content: 'text', summary: 'text' });
NewsSchema.index({ category: 1 });
NewsSchema.index({ tags: 1 });
NewsSchema.index({ isFeatured: 1 });
NewsSchema.index({ publishDate: -1 });

export default mongoose.model<INews>('News', NewsSchema);