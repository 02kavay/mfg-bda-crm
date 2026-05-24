import mongoose, { Schema, Document } from 'mongoose';

export type CommType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';

export interface ICommunication extends Document {
  leadId: mongoose.Types.ObjectId;
  bdaId: mongoose.Types.ObjectId;
  type: CommType;
  content: string;
  createdAt: Date;
}

const CommunicationSchema: Schema = new Schema({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  bdaId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE'], 
    default: 'NOTE' 
  },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

CommunicationSchema.index({ leadId: 1 });

export default mongoose.model<ICommunication>('Communication', CommunicationSchema);
