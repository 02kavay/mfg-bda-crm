import mongoose, { Schema, Document } from 'mongoose';

export type LeadStage = 'NEW' | 'CONTACTED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ILead extends Document {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  title: string;
  description?: string;
  stage: LeadStage;
  priority: LeadPriority;
  dealValue: number;
  quantity: number;
  productType: 'Industrial Gears' | 'Hydraulic Pumps' | 'Metal Sheets' | 'Turbines' | 'Valves' | 'Custom Castings';
  bdaAssignee: mongoose.Types.ObjectId;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  stage: { 
    type: String, 
    enum: ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'], 
    default: 'NEW' 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  dealValue: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true, default: 1 },
  productType: { 
    type: String, 
    enum: ['Industrial Gears', 'Hydraulic Pumps', 'Metal Sheets', 'Turbines', 'Valves', 'Custom Castings'],
    required: true 
  },
  bdaAssignee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followUpDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for fast searching and pipeline grouping
LeadSchema.index({ stage: 1 });
LeadSchema.index({ bdaAssignee: 1 });

export default mongoose.model<ILead>('Lead', LeadSchema);
