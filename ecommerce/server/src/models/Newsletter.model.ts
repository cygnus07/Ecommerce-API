import mongoose, { Schema, model } from 'mongoose';

export interface NewsletterSubscriptionDocument {
  _id: string;
  email: string;
  isVerified: boolean;
  verificationToken?: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  status: 'active' | 'unsubscribed';
  tags: string[];
  lastSentAt?: Date;
}

// Newsletter subscription schema
const newsletterSubscriptionSchema = new Schema<NewsletterSubscriptionDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationToken: { 
    type: String 
  },
  subscribedAt: { 
    type: Date, 
    default: Date.now 
  },
  unsubscribedAt: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['active', 'unsubscribed'], 
    default: 'active' 
  },
  tags: [{ 
    type: String 
  }],
  lastSentAt: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Indexes
newsletterSubscriptionSchema.index({ email: 1 }, { unique: true });
newsletterSubscriptionSchema.index({ status: 1 });
newsletterSubscriptionSchema.index({ tags: 1 });

const NewsletterSubscription = mongoose.models.NewsletterSubscription || 
  model<NewsletterSubscriptionDocument>('NewsletterSubscription', newsletterSubscriptionSchema);

export default NewsletterSubscription;