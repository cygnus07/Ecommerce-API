// models/BlacklistedToken.model.ts
import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  }
});

// Create TTL index (auto-deletes expired tokens)
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('BlacklistedToken', blacklistedTokenSchema);