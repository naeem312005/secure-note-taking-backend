import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Explicit schema.index() definitions as mandated by assignment
// 1. Compound index on { userId: 1, createdAt: -1 }
// Supports user note listing: filters by userId and sorts by createdAt descending.
// Follows MongoDB ESR (Equality, Sort, Range) rule.
noteSchema.index({ userId: 1, createdAt: -1 });

// 2. Index on { createdAt: -1 }
// Supports admin listing of all notes across the system sorted chronologically.
noteSchema.index({ createdAt: -1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
