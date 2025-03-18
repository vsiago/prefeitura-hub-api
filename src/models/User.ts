import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: string;
  department: mongoose.Schema.Types.ObjectId;
  position: string;
  phone: string;
  bio: string;
  isActive: boolean;
  lastActive: Date;
  notificationSettings: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    types: {
      posts: boolean;
      messages: boolean;
      events: boolean;
      groups: boolean;
    };
  };
  resetPasswordToken: string;
  resetPasswordExpire: Date;
  createdAt: Date;
  getSignedJwtToken(): string;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, adicione um nome']
  },
  email: {
    type: String,
    required: [true, 'Por favor, adicione um email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, adicione um email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor, adicione uma senha'],
    minlength: 6,
    select: false
  },
  avatar: {
    type: String,
    default: '/uploads/avatars/default.png'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  position: {
    type: String,
    required: [true, 'Por favor, adicione um cargo']
  },
  phone: {
    type: String
  },
  bio: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  notificationSettings: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    desktop: {
      type: Boolean,
      default: true
    },
    types: {
      posts: {
        type: Boolean,
        default: true
      },
      messages: {
        type: Boolean,
        default: true
      },
      events: {
        type: Boolean,
        default: true
      },
      groups: {
        type: Boolean,
        default: true
      }
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Criptografar senha usando bcrypt
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Assinar token JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Verificar se a senha informada corresponde à senha criptografada
UserSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Gerar e hash token para redefinição de senha
UserSchema.methods.getResetPasswordToken = function() {
  // Gerar token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token e definir no campo resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Definir expiração
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos

  return resetToken;
};

export default mongoose.model<IUser>('User', UserSchema);