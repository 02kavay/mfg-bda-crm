import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Lead from '../models/Lead';
import Communication from '../models/Communication';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mfg_bda';

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database. Cleaning collections...');

    // Clear existing data
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Communication.deleteMany({});

    console.log('Database cleaned. Creating Indian users...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create Manager/Admin
    const manager = new User({
      name: 'Sarah Sharma (Sales Manager)',
      email: 'manager@gmail.com',
      passwordHash,
      role: 'MANAGER',
      avatarUrl: ''
    });
    await manager.save();

    // Create BDAs
    const bda1 = new User({
      name: 'Aditya Patel',
      email: 'aditya@gmail.com',
      passwordHash,
      role: 'BDA'
    });
    await bda1.save();

    const bda2 = new User({
      name: 'Vikram Singh',
      email: 'vikram@gmail.com',
      passwordHash,
      role: 'BDA'
    });
    await bda2.save();

    const bda3 = new User({
      name: 'Rajesh Verma',
      email: 'rajesh@gmail.com',
      passwordHash,
      role: 'BDA'
    });
    await bda3.save();

    console.log('Users created. Seeding Indian manufacturing leads...');

    // Mock Indian Leads Data (Values in INR)
    const leadsData = [
      {
        companyName: 'Tata Motors Pune',
        contactPerson: 'Amit Sharma',
        email: 'asharma@tatamotors.com',
        phone: '+91-98765-43210',
        title: '2,500 Precision Gears Supply Contract',
        description: 'Tata Motors Pune needs custom-engineered high-precision gearboxes for their next EV truck chassis rollout.',
        stage: 'NEGOTIATION',
        priority: 'HIGH',
        dealValue: 7500000, // ₹75 Lakhs
        quantity: 2500,
        productType: 'Industrial Gears',
        bdaAssignee: bda1._id,
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days later
      },
      {
        companyName: 'Mahindra & Mahindra',
        contactPerson: 'Vinay Rao',
        email: 'vrao@mahindra.com',
        phone: '+91-99887-76655',
        title: '500 Heavy Duty Hydraulic Pumps',
        description: 'Inquiry for high-pressure heavy-duty pumps for tractor hydraulic assemblies.',
        stage: 'PROPOSAL',
        priority: 'MEDIUM',
        dealValue: 2800000, // ₹28 Lakhs
        quantity: 500,
        productType: 'Hydraulic Pumps',
        bdaAssignee: bda1._id,
        followUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },
      {
        companyName: 'Kirloskar Engines',
        contactPerson: 'Priya Patel',
        email: 'ppatel@kirloskar.com',
        phone: '+91-91234-56789',
        title: 'Supply of Custom Metal Castings',
        description: 'Looking to purchase a batch of raw metal castings and engine housings.',
        stage: 'NEW',
        priority: 'LOW',
        dealValue: 1200000, // ₹12 Lakhs
        quantity: 120,
        productType: 'Custom Castings',
        bdaAssignee: bda2._id
      },
      {
        companyName: 'Bharat Heavy Electricals Ltd (BHEL)',
        contactPerson: 'Suresh Raina',
        email: 'sraina@bhel.co.in',
        phone: '+91-88888-99999',
        title: '15 High-Capacity Steam Turbines',
        description: 'Large-scale power project infrastructure contract negotiation for thermal units.',
        stage: 'WON',
        priority: 'URGENT',
        dealValue: 45000000, // ₹4.5 Crores
        quantity: 15,
        productType: 'Turbines',
        bdaAssignee: bda2._id
      },
      {
        companyName: 'L&T Valves Division',
        contactPerson: 'Rahul Sen',
        email: 'rsen@lnthydro.com',
        phone: '+91-77777-66666',
        title: '1,200 High-Temp Industrial Valves',
        description: 'Contract for petrochemical-grade stainless steel safety valves.',
        stage: 'CONTACTED',
        priority: 'HIGH',
        dealValue: 2400000, // ₹24 Lakhs
        quantity: 1200,
        productType: 'Valves',
        bdaAssignee: bda3._id,
        followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        companyName: 'JSW Steel Vijayanagar',
        contactPerson: 'Neha Gupta',
        email: 'ngupta@jsw.in',
        phone: '+91-95555-44444',
        title: 'Steel Sheet Metal Batch Procurement',
        description: 'Bulk cold-rolled steel sheet purchase for structure fabrication.',
        stage: 'LOST',
        priority: 'LOW',
        dealValue: 3500000, // ₹35 Lakhs
        quantity: 1000,
        productType: 'Metal Sheets',
        bdaAssignee: bda3._id
      },
      {
        companyName: 'Adani Power Gujarat',
        contactPerson: 'Pranav Shah',
        email: 'pshah@adani.com',
        phone: '+91-96666-55555',
        title: 'Industrial Turbine Spare Parts Order',
        description: 'Refurbishing turbine rotors and stator blades under custom contract.',
        stage: 'WON',
        priority: 'MEDIUM',
        dealValue: 9500000, // ₹95 Lakhs
        quantity: 1,
        productType: 'Turbines',
        bdaAssignee: bda1._id
      },
      {
        companyName: 'Reliance Industries Jamnagar',
        contactPerson: 'Sanjay Mehta',
        email: 'sanjay.mehta@ril.com',
        phone: '+91-98222-11111',
        title: '3,000 High-Pressure Control Valves',
        description: 'Reliance Jamnagar Refinery division needs customized high-pressure high-temperature control valves.',
        stage: 'NEW',
        priority: 'MEDIUM',
        dealValue: 5600000, // ₹56 Lakhs
        quantity: 3000,
        productType: 'Valves',
        bdaAssignee: bda1._id
      },
      {
        companyName: 'HAL Bangalore',
        contactPerson: 'Kiran Nadar',
        email: 'knadar@hal-india.co.in',
        phone: '+91-80252-00000',
        title: 'Precision Aircraft Structural Gears',
        description: 'Hindustan Aeronautics Limited needs high-stress precision gearboxes for transport aircraft assemblies.',
        stage: 'NEGOTIATION',
        priority: 'URGENT',
        dealValue: 18000000, // ₹1.8 Crores
        quantity: 50,
        productType: 'Industrial Gears',
        bdaAssignee: bda1._id,
        followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        companyName: 'ISRO Satellite Centre',
        contactPerson: 'Dr. R. Kesavan',
        email: 'rkesavan@isro.gov.in',
        phone: '+91-94444-33333',
        title: 'Custom Titanium Alloy Castings',
        description: 'Requirement for custom structural castings with low thermal expansion coefficients.',
        stage: 'WON',
        priority: 'HIGH',
        dealValue: 12500000, // ₹1.25 Crores
        quantity: 12,
        productType: 'Custom Castings',
        bdaAssignee: bda1._id
      }
    ];

    const seededLeads = [];
    for (const leadItem of leadsData) {
      const lead = new Lead(leadItem);
      await lead.save();
      seededLeads.push(lead);
    }

    console.log('Leads seeded. Adding communication history logs...');

    // Add communication history
    const communications = [
      {
        leadId: seededLeads[0]._id, // Tata Motors
        bdaId: bda1._id,
        type: 'CALL',
        content: 'Spoke with Amit Sharma about gear tolerances. They require ISO 9001 certified batch testing. Agreed to submit pricing revisions in INR by Tuesday.'
      },
      {
        leadId: seededLeads[0]._id,
        bdaId: bda1._id,
        type: 'EMAIL',
        content: 'Sent technical datasheet of standard helical gear series and updated proposal quotation markup.'
      },
      {
        leadId: seededLeads[1]._id, // Mahindra
        bdaId: bda1._id,
        type: 'NOTE',
        content: 'Customer is comparing our hydraulic pumps with local competitors. Highlighted our 5-year pan-India service warranty to sway their decision.'
      },
      {
        leadId: seededLeads[4]._id, // L&T Valves
        bdaId: bda3._id,
        type: 'CALL',
        content: 'Cold call to procurement team. Rahul Sen expressed interest in custom valves. Setting up a technical overview Zoom call.'
      },
      {
        leadId: seededLeads[3]._id, // BHEL
        bdaId: bda2._id,
        type: 'MEETING',
        content: 'On-site closing meeting at BHEL Delhi office. Contract signed for 15 turbines. Handed off engineering design documents to Nagpur workshop.'
      },
      {
        leadId: seededLeads[7]._id, // Reliance Jamnagar
        bdaId: bda1._id,
        type: 'EMAIL',
        content: 'Received detailed RFP for the 3000 control valves. Sanjay Mehta requested technical compliance sheet by Friday.'
      },
      {
        leadId: seededLeads[8]._id, // HAL Bangalore
        bdaId: bda1._id,
        type: 'MEETING',
        content: 'Met Kiran Nadar at HAL Bangalore HQ. Reviewed aviation gear design requirements. They requested sample testing reports.'
      },
      {
        leadId: seededLeads[9]._id, // ISRO
        bdaId: bda1._id,
        type: 'CALL',
        content: 'Call with Dr. R. Kesavan. Confirmed successful receipt of purchase order. Workshop team has initiated titanium casting molds.'
      }
    ];

    for (const commItem of communications) {
      const comm = new Communication(commItem);
      await comm.save();
    }

    console.log('Indian Database Seeding Successful!');
  } catch (error) {
    console.error('Seeding Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
