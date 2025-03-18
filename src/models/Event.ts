import mongoose from 'mongoose';

export interface IEvent extends mongoose.Document {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  creator: mongoose.Schema.Types.ObjectId;
  attendees: mongoose.Schema.Types.ObjectId[];
  department: mongoose.Schema.Types.ObjectId;
  group: mongoose.Schema.Types.ObjectId;
  isAllDay: boolean;
  isRecurring: boolean;
  recurringPattern: {
    frequency: string;
    interval: number;
    endDate: Date;
  };
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, adicione uma descrição']
  },
  location: {
    type: String
  },
  startDate: {
    type: Date,
    required: [true, 'Por favor, adicione uma data de início']
  },
  endDate: {
    type: Date,
    required: [true, 'Por favor, adicione uma data de término']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: {
      type: Date
    }
  },
  color: {
    type: String,
    default: '#3788d8'
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
EventSchema.pre<IEvent>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual para contar participantes
EventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.length;
});

// Índices para melhorar a performance das consultas
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ creator: 1 });
EventSchema.index({ department: 1 });
EventSchema.index({ group: 1 });

export default mongoose.model<IEvent>('Event', EventSchema);