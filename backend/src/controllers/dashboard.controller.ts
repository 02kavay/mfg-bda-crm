import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import Lead from '../models/Lead';
import User from '../models/User';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isBDA = req.user!.role === 'BDA';
    const userId = req.user!.id;

    // Filter metrics by BDA assignee if it is a BDA requesting
    const matchFilter: any = {};
    if (isBDA) {
      matchFilter.bdaAssignee = userId;
    }

    // 1. Core KPIs: Total Value, Closed Won, Open Deals, Conversion Rate
    const totalPipelineResult = await Lead.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, totalValue: { $sum: '$dealValue' }, count: { $sum: 1 } } }
    ]);

    const wonPipelineResult = await Lead.aggregate([
      { $match: { ...matchFilter, stage: 'WON' } },
      { $group: { _id: null, wonValue: { $sum: '$dealValue' }, count: { $sum: 1 } } }
    ]);

    const lostPipelineResult = await Lead.aggregate([
      { $match: { ...matchFilter, stage: 'LOST' } },
      { $group: { _id: null, lostValue: { $sum: '$dealValue' }, count: { $sum: 1 } } }
    ]);

    const activeStages = ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION'];
    const activePipelineResult = await Lead.aggregate([
      { $match: { ...matchFilter, stage: { $in: activeStages } } },
      { $group: { _id: null, activeValue: { $sum: '$dealValue' }, count: { $sum: 1 } } }
    ]);

    const totalPipeline = totalPipelineResult[0]?.totalValue || 0;
    const totalDeals = totalPipelineResult[0]?.count || 0;
    const wonPipeline = wonPipelineResult[0]?.wonValue || 0;
    const wonDeals = wonPipelineResult[0]?.count || 0;
    const lostDeals = lostPipelineResult[0]?.count || 0;
    const activePipeline = activePipelineResult[0]?.activeValue || 0;
    const activeDeals = activePipelineResult[0]?.count || 0;

    // Conversion Rate: WON / (WON + LOST)
    const closedDeals = wonDeals + lostDeals;
    const conversionRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    // 2. Lead Pipeline Stages Distribution (Funnel count & value)
    const pipelineDistribution = await Lead.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          value: { $sum: '$dealValue' }
        }
      }
    ]);

    // Format stages structure for charting
    const stages = ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const formattedPipeline = stages.map(s => {
      const found = pipelineDistribution.find(d => d._id === s);
      return {
        stage: s,
        count: found ? found.count : 0,
        value: found ? found.value : 0
      };
    });

    // 3. Product Performance Distribution (Value & Quantity breakdown)
    const productDistribution = await Lead.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$productType',
          value: { $sum: '$dealValue' },
          quantity: { $sum: '$quantity' }
        }
      },
      { $sort: { value: -1 } }
    ]);

    const formattedProducts = productDistribution.map(p => ({
      name: p._id,
      value: p.value,
      quantity: p.quantity
    }));

    // 4. BDA Performance Leaderboard (Total Sales Won Value - Managers & Admins only)
    let leaderboard: any[] = [];
    if (!isBDA) {
      const bdaPerformance = await Lead.aggregate([
        { $match: { stage: 'WON' } },
        {
          $group: {
            _id: '$bdaAssignee',
            totalSales: { $sum: '$dealValue' },
            dealsWon: { $sum: 1 }
          }
        },
        { $sort: { totalSales: -1 } }
      ]);

      // Populate user names
      const users = await User.find({ _id: { $in: bdaPerformance.map(b => b._id) } }).select('name email');
      leaderboard = bdaPerformance.map(b => {
        const user = users.find(u => u.id === b._id.toString());
        return {
          name: user ? user.name : 'Unknown BDA',
          email: user ? user.email : '',
          totalSales: b.totalSales,
          dealsWon: b.dealsWon
        };
      });
    }

    res.json({
      summary: {
        totalPipeline,
        totalDeals,
        wonPipeline,
        wonDeals,
        activePipeline,
        activeDeals,
        conversionRate
      },
      pipelineDistribution: formattedPipeline,
      productDistribution: formattedProducts,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate dashboard metrics.' });
  }
};
