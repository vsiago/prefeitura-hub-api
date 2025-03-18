import mongoose from 'mongoose';

export interface IComment extends mongoose.Document {
  content: string;
  author: mongoose.Schema.Types.ObjectId;
  post: mongoose.Schema.Types.ObjectId;
  likes: mongoose.Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Por favor, adicione um conteúdo']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
CommentSchema.pre<IComment>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual para contar likes
CommentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Índices para melhorar a performance das consultas
CommentSchema.index({ post: 1, createdAt: 1 });
CommentSchema.index({ author: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);