import mongoose from 'mongoose';

export interface IPost extends mongoose.Document {
  title: string;
  content: string;
  author: mongoose.Schema.Types.ObjectId;
  media: string[];
  likes: mongoose.Schema.Types.ObjectId[];
  comments: mongoose.Schema.Types.ObjectId[];
  group: mongoose.Schema.Types.ObjectId;
  department: mongoose.Schema.Types.ObjectId;
  tags: string[];
  isPublished: boolean;
  publishDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new mongoose.Schema({
  title: {
    type: String
  },
  content: {
    type: String,
    required: [true, 'Por favor, adicione um conteúdo']
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
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
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
  tags: [
    {
      type: String
    }
  ],
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware para atualizar o campo updatedAt antes de salvar
PostSchema.pre<IPost>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual para contar likes
PostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual para contar comentários
PostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Índices para melhorar a performance das consultas
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ group: 1, createdAt: -1 });
PostSchema.index({ department: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });

export default mongoose.model<IPost>('Post', PostSchema);