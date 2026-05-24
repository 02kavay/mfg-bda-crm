import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import Lead from '../models/Lead';
import Communication from '../models/Communication';

export const createLead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyName, contactPerson, email, phone, title, description, stage, priority, dealValue, quantity, productType, bdaAssignee, followUpDate } = req.body;

    // A BDA cannot assign a lead to someone else, but Manager/Admin can.
    // Default to themselves if not provided.
    const assignee = req.user!.role === 'BDA' ? req.user!.id : (bdaAssignee || req.user!.id);

    const lead = new Lead({
      companyName,
      contactPerson,
      email,
      phone,
      title,
      description,
      stage: stage || 'NEW',
      priority: priority || 'MEDIUM',
      dealValue,
      quantity,
      productType,
      bdaAssignee: assignee,
      followUpDate
    });

    await lead.save();
    
    // Populate assignee details for frontend usage
    const populatedLead = await lead.populate('bdaAssignee', 'name email');

    // Trigger Socket.io real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('lead_created', populatedLead);
    }

    res.status(201).json(populatedLead);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create lead' });
  }
};

export const getLeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query: any = {};
    
    // BDA role should only see their assigned leads. Managers and Admins see all.
    if (req.user!.role === 'BDA') {
      query.bdaAssignee = req.user!.id;
    }

    const leads = await Lead.find(query)
      .populate('bdaAssignee', 'name email')
      .sort({ updatedAt: -1 });

    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const updateLead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check ownership for BDA
    if (req.user!.role === 'BDA') {
      const existingLead = await Lead.findById(id);
      if (!existingLead || existingLead.bdaAssignee.toString() !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized to modify this lead.' });
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('bdaAssignee', 'name email');

    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Trigger Socket.io real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('lead_updated', updatedLead);
    }

    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const deleteLead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership for BDA
    if (req.user!.role === 'BDA') {
      const existingLead = await Lead.findById(id);
      if (!existingLead || existingLead.bdaAssignee.toString() !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this lead.' });
      }
    }

    const deletedLead = await Lead.findByIdAndDelete(id);
    if (!deletedLead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Cascade delete communication logs
    await Communication.deleteMany({ leadId: id });

    // Trigger Socket.io real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('lead_deleted', id);
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

// --- Communication Logs Controllers ---

export const createCommunicationLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leadId, type, content } = req.body;

    // Verify lead access
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    if (req.user!.role === 'BDA' && lead.bdaAssignee.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to add logs to this lead.' });
    }

    const log = new Communication({
      leadId,
      bdaId: req.user!.id,
      type,
      content
    });

    await log.save();

    const populatedLog = await log.populate('bdaId', 'name email');

    res.status(201).json(populatedLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create communication log' });
  }
};

export const getCommunicationLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leadId } = req.params;

    // Verify lead access
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    if (req.user!.role === 'BDA' && lead.bdaAssignee.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to view these logs.' });
    }

    const logs = await Communication.find({ leadId })
      .populate('bdaId', 'name email')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};
