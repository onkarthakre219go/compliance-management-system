import bcrypt from 'bcryptjs';

// Pre-seeded hashed password for 'password123'
const SEED_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

export interface MockUser {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Trainee';
  phone?: string;
  designation?: string;
  active: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
}

export interface MockClient {
  _id: string;
  name: string;
  tradeName?: string;
  constitution: 'Proprietorship' | 'Partnership' | 'LLP' | 'Private Limited' | 'Public Limited' | 'Trust' | 'Individual';
  pan: string;
  gstType: 'Regular' | 'Composition' | 'Unregistered' | 'None';
  filingFrequency: 'Monthly' | 'Quarterly' | 'None';
  assignedTo?: string; // MockUser ID
  tags: string[];
  status: 'active' | 'inactive';
  grade: 'A' | 'B' | 'C' | 'D';
  clientType: 'Corporate' | 'Retail' | 'HNW' | 'SME' | 'Others';
  createdAt: Date;
}

export interface MockContact {
  _id: string;
  clientId: string;
  name: string;
  designation?: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  alternatePhone?: string;
  createdAt: Date;
}

export interface MockTask {
  _id: string;
  title: string;
  description?: string;
  clientId: string;
  assignedTo?: string;
  templateId?: string;
  status: 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: Date;
  actualCompletionDate?: Date;
  notes?: string;
  attachments: { _id: string; filename: string; url?: string; mimeType?: string; uploadedBy?: string; uploadedAt: Date }[];
  comments?: { _id: string; authorId: string; text: string; createdAt: Date }[];
  createdAt: Date;
}

export interface MockComplianceTemplate {
  _id: string;
  title: string;
  description?: string;
  category: 'GST' | 'Income Tax' | 'Corporate Law' | 'Audit' | 'MSME' | 'FEMA' | 'Other';
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'One-Time';
  checklistItems: { itemText: string; isMandatory: boolean }[];
  averageMinutesToComplete?: number;
  applicableClientTypes?: ('Pvt Ltd' | 'Public Ltd' | 'LLP' | 'OPC' | 'Partnership' | 'Proprietorship')[];
  dueDateRule?: {
    ruleType: 'DayOfMonth' | 'DaysAfterMonthEnd' | 'DaysAfterQuarterEnd' | 'DaysAfterYearEnd' | 'SpecificDate';
    daysOffset?: number;
    specificDate?: Date;
  };
  reminderRules?: {
    daysBefore?: number[];
    channel?: 'Email' | 'Sms' | 'App' | 'Email & App';
  };
}

export interface MockComplianceCalendar {
  _id: string;
  templateId?: string;
  title: string;
  description?: string;
  category: 'GST' | 'Income Tax' | 'Corporate Law' | 'Audit' | 'MSME' | 'FEMA' | 'Other';
  dueDate: Date;
  extDueDate?: Date;
  penaltyAmountMultiplier?: number;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'One-Time';
  status: 'Upcoming' | 'Extended' | 'Completed' | 'Missed';
  notes?: string;
}

export interface MockInvoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  items: { description: string; amount: number; gstRate: number; sacCode?: string; feeType?: 'Professional' | 'Government' }[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void';
  notes?: string;
  createdAt: Date;
}

export interface MockPayment {
  _id: string;
  invoiceId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Credit Card';
  transactionId?: string;
  reference?: string;
  notes?: string;
}

export interface MockExpense {
  _id: string;
  title: string;
  category: 'Travel' | 'Government Fees' | 'Office Supplies' | 'Tech Subscriptions' | 'Task Expense' | 'Other';
  amount: number;
  spentDate: Date;
  spentBy: string;
  taskId?: string;
  paymentStatus: 'Paid' | 'Reimbursement Pending';
  receiptUrl?: string;
  description?: string;
  createdAt: Date;
}

export interface MockNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'deadline_approaching' | 'payment_received' | 'overdue_invoice' | 'system';
  read: boolean;
  createdAt: Date;
}

class MockDb {
  public users: MockUser[] = [];
  public clients: MockClient[] = [];
  public contacts: MockContact[] = [];
  public tasks: MockTask[] = [];
  public templates: MockComplianceTemplate[] = [];
  public calendar: MockComplianceCalendar[] = [];
  public invoices: MockInvoice[] = [];
  public payments: MockPayment[] = [];
  public expenses: MockExpense[] = [];
  public notifications: MockNotification[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const d = new Date();
    
    // Seed Users
    this.users = [
      {
        _id: 'usr_admin',
        username: 'admin',
        email: 'admin@firm.com',
        fullName: 'CA Rajesh Sharma',
        role: 'Admin',
        passwordHash: SEED_PASSWORD_HASH,
        phone: '+91 98765 43210',
        designation: 'Senior Managing Partner',
        active: true,
        createdAt: new Date(d.getTime() - 90 * 24 * 3600 * 1000)
      },
      {
        _id: 'usr_partner',
        username: 'partner',
        email: 'partner@firm.com',
        fullName: 'CS Priyanka Verma',
        role: 'Manager',
        passwordHash: SEED_PASSWORD_HASH,
        phone: '+91 91234 56789',
        designation: 'Partner - Corporate Law',
        active: true,
        createdAt: new Date(d.getTime() - 60 * 24 * 3600 * 1000)
      },
      {
        _id: 'usr_associate',
        username: 'associate',
        email: 'associate@firm.com',
        fullName: 'Amit Patel',
        role: 'Employee',
        passwordHash: SEED_PASSWORD_HASH,
        phone: '+91 81234 56789',
        designation: 'Tax Associate',
        active: true,
        createdAt: new Date(d.getTime() - 30 * 24 * 3600 * 1000)
      }
    ];

    // Seed Clients
    this.clients = [
      {
        _id: 'cli_alpha',
        name: 'Alpha Retailers Private Limited',
        tradeName: 'Alpha Supermart',
        constitution: 'Private Limited',
        pan: 'AAACA1234F',
        gstType: 'Regular',
        filingFrequency: 'Monthly',
        assignedTo: 'usr_associate',
        tags: ['Retail', 'Corporate', 'GST-Filing'],
        status: 'active',
        grade: 'A',
        clientType: 'Corporate',
        createdAt: new Date(d.getTime() - 40 * 24 * 3600 * 1000)
      },
      {
        _id: 'cli_zenith',
        name: 'Zenith Biotech LLP',
        constitution: 'LLP',
        pan: 'AABCB4321K',
        gstType: 'Regular',
        filingFrequency: 'Quarterly',
        assignedTo: 'usr_partner',
        tags: ['Healthcare', 'LLP', 'Compliance-Heavy'],
        status: 'active',
        grade: 'B',
        clientType: 'Corporate',
        createdAt: new Date(d.getTime() - 25 * 24 * 3600 * 1000)
      },
      {
        _id: 'cli_sharma',
        name: 'Sharma & Sons Enterprises',
        tradeName: 'Sharma Foods',
        constitution: 'Partnership',
        pan: 'AABCS9876E',
        gstType: 'Composition',
        filingFrequency: 'Quarterly',
        assignedTo: 'usr_associate',
        tags: ['SME', 'FMCG'],
        status: 'active',
        grade: 'C',
        clientType: 'SME',
        createdAt: new Date(d.getTime() - 15 * 24 * 3600 * 1000)
      },
      {
        _id: 'cli_mehta',
        name: 'Arun Kumar Mehta',
        constitution: 'Individual',
        pan: 'BPMCA7766G',
        gstType: 'None',
        filingFrequency: 'None',
        assignedTo: 'usr_admin',
        tags: ['High-Net-Worth', 'Income-Tax'],
        status: 'active',
        grade: 'A',
        clientType: 'HNW',
        createdAt: new Date(d.getTime() - 50 * 24 * 3600 * 1000)
      }
    ];

    // Seed Contacts
    this.contacts = [
      {
        _id: 'con_1',
        clientId: 'cli_alpha',
        name: 'Vikram Singh',
        designation: 'Managing Director',
        email: 'vikram@alpharetail.com',
        phone: '+91 97777 66666',
        isPrimary: true,
        createdAt: new Date()
      },
      {
        _id: 'con_2',
        clientId: 'cli_alpha',
        name: 'Neha Roy',
        designation: 'CFO',
        email: 'neha.cfo@alpharetail.com',
        phone: '+91 96666 55555',
        isPrimary: false,
        createdAt: new Date()
      },
      {
        _id: 'con_3',
        clientId: 'cli_zenith',
        name: 'Dr. Suresh Mehta',
        designation: 'Designated Partner',
        email: 'suresh@zenithbio.co.in',
        phone: '+91 90000 11111',
        isPrimary: true,
        createdAt: new Date()
      }
    ];

    // Seed Compliance Templates
    this.templates = [
      {
        _id: 'tmp_gst_gstr1',
        title: 'GSTR-1 Monthly Return Filing',
        description: 'Monthly return for Outward Supplies of Goods or Services under GST rules.',
        category: 'GST',
        frequency: 'Monthly',
        checklistItems: [
          { itemText: 'Synthesize invoice register from ERP and client upload.', isMandatory: true },
          { itemText: 'Validate HSN summaries and document sequences.', isMandatory: true },
          { itemText: 'Reconcile mismatch bills with manual bills ledger.', isMandatory: true },
          { itemText: 'Preview filing summary and send for Client Confirmation via OTP.', isMandatory: true },
          { itemText: 'Submit and File return via GST portal.', isMandatory: true }
        ],
        averageMinutesToComplete: 45,
        applicableClientTypes: ['Pvt Ltd', 'Public Ltd', 'LLP', 'Partnership', 'Proprietorship', 'OPC'],
        dueDateRule: {
          ruleType: 'DayOfMonth',
          daysOffset: 11
        },
        reminderRules: {
          daysBefore: [5, 2, 1],
          channel: 'Email & App'
        }
      },
      {
        _id: 'tmp_tds_24q',
        title: 'Form 24Q TDS (Salary) Quarterly Return',
        description: 'Quarterly statement for tax deducted at source from salary income payments.',
        category: 'Income Tax',
        frequency: 'Quarterly',
        checklistItems: [
          { itemText: 'Collect month-wise payroll reports and tax deduction sheets.', isMandatory: true },
          { itemText: 'Validate Challan payments on Protean (NSDL) TIN Portal.', isMandatory: true },
          { itemText: 'Generate FVU structure file using NSDL Utility tool.', isMandatory: true },
          { itemText: 'Submit returns and obtain token numbers.', isMandatory: true }
        ],
        averageMinutesToComplete: 60,
        applicableClientTypes: ['Pvt Ltd', 'Public Ltd', 'LLP', 'Partnership', 'Proprietorship', 'OPC'],
        dueDateRule: {
          ruleType: 'DaysAfterQuarterEnd',
          daysOffset: 31
        },
        reminderRules: {
          daysBefore: [7, 3, 1],
          channel: 'Email'
        }
      },
      {
        _id: 'tmp_corp_dir3',
        title: 'DIR-3 KYC Director KYC Filings',
        description: 'Annual KYC compliance verification filed under MCA21 portal for active Directors.',
        category: 'Corporate Law',
        frequency: 'Annual',
        checklistItems: [
          { itemText: 'Obtain self-attested PAN and Aadhaar duplicates.', isMandatory: true },
          { itemText: 'Verify Mobile OTP and Email OTP verification with director.', isMandatory: true },
          { itemText: 'Affix designated CS Digital Signature Certificate (DSC).', isMandatory: true },
          { itemText: 'Upload e-Form on MCA and retrieve acknowledgement.', isMandatory: true }
        ],
        averageMinutesToComplete: 30,
        applicableClientTypes: ['Pvt Ltd', 'Public Ltd', 'OPC'],
        dueDateRule: {
          ruleType: 'DaysAfterYearEnd',
          daysOffset: 180
        },
        reminderRules: {
          daysBefore: [15, 5, 2],
          channel: 'Email & App'
        }
      },
      {
        _id: 'tmp_corp_aoc4',
        title: 'AOC-4 Financial Statement Filing',
        description: 'Filing of financial statements with the Registrar of Companies (ROC) in Form AOC-4.',
        category: 'Corporate Law',
        frequency: 'Annual',
        checklistItems: [
          { itemText: 'Prepare Balance Sheet, Profit and Loss account, and Cash Flow statement.', isMandatory: true },
          { itemText: 'Ensure Directors Report and Auditors Report are annexed.', isMandatory: true },
          { itemText: 'Get DSC of Director and professional (CA/CS).', isMandatory: true },
          { itemText: 'Upload on MCA Portal and pay statutory filing fee.', isMandatory: true }
        ],
        averageMinutesToComplete: 120,
        applicableClientTypes: ['Pvt Ltd', 'Public Ltd', 'OPC'],
        dueDateRule: {
          ruleType: 'DaysAfterYearEnd',
          daysOffset: 210
        },
        reminderRules: {
          daysBefore: [15, 7, 2],
          channel: 'Email & App'
        }
      },
      {
        _id: 'tmp_corp_mgt7',
        title: 'MGT-7 Annual Return Filing',
        description: 'Filing of annual return with the Registrar of Companies (ROC) containing details of shareholding and compliance.',
        category: 'Corporate Law',
        frequency: 'Annual',
        checklistItems: [
          { itemText: 'Extract latest shareholder list and share transfer details.', isMandatory: true },
          { itemText: 'Verify board meetings and annual general meeting records.', isMandatory: true },
          { itemText: 'Affix DSC of director and practicing CA/CS.', isMandatory: true },
          { itemText: 'File return on MCA portal within 60 days of AGM.', isMandatory: true }
        ],
        averageMinutesToComplete: 90,
        applicableClientTypes: ['Pvt Ltd', 'Public Ltd', 'OPC'],
        dueDateRule: {
          ruleType: 'DaysAfterYearEnd',
          daysOffset: 240
        },
        reminderRules: {
          daysBefore: [15, 5, 2],
          channel: 'Email & App'
        }
      },
      {
        _id: 'tmp_corp_agm',
        title: 'Annual General Meeting (AGM) Compliance',
        description: 'Holding of AGM and preparing necessary resolutions and corporate minutes.',
        category: 'Corporate Law',
        frequency: 'Annual',
        checklistItems: [
          { itemText: 'Draft AGM notice and agenda to all members.', isMandatory: true },
          { itemText: 'Conduct AGM within 6 months of financial year end.', isMandatory: true },
          { itemText: 'Record and sign minutes of the AGM.', isMandatory: true }
        ],
        averageMinutesToComplete: 60,
        applicableClientTypes: ['Pvt Ltd', 'Public Ltd'],
        dueDateRule: {
          ruleType: 'DaysAfterYearEnd',
          daysOffset: 183
        },
        reminderRules: {
          daysBefore: [30, 15, 5],
          channel: 'Email & App'
        }
      },
      {
        _id: 'tmp_llp_form8',
        title: 'Form 8 LLP Statement of Account & Solvency',
        description: 'Filing statement of accounts and solvency under section 34(4) of LLP Act, 2008.',
        category: 'Corporate Law',
        frequency: 'Annual',
        checklistItems: [
          { itemText: 'Prepare Statement of Accounts and Solvency of the LLP.', isMandatory: true },
          { itemText: 'Declare solvency by Designated Partners.', isMandatory: true },
          { itemText: 'File Form 8 on MCA portal with partner digital signatures.', isMandatory: true }
        ],
        averageMinutesToComplete: 90,
        applicableClientTypes: ['LLP'],
        dueDateRule: {
          ruleType: 'DaysAfterYearEnd',
          daysOffset: 214
        },
        reminderRules: {
          daysBefore: [15, 7, 2],
          channel: 'Email & App'
        }
      },
      {
        _id: 'tmp_llp_form11',
        title: 'Form 11 LLP Annual Return Filing',
        description: 'Filing of Year-end Annual Return under Section 35(1) of LLP Act, 2008.',
        category: 'Corporate Law',
        frequency: 'Annual',
        checklistItems: [
          { itemText: 'Affix partner details and summaries of contributions.', isMandatory: true },
          { itemText: 'Confirm total number of designative and working partners.', isMandatory: true },
          { itemText: 'Sign using DSC and profession authentication.', isMandatory: true },
          { itemText: 'File on MCA portal within 60 days of FY closure.', isMandatory: true }
        ],
        averageMinutesToComplete: 60,
        applicableClientTypes: ['LLP'],
        dueDateRule: {
          ruleType: 'DaysAfterYearEnd',
          daysOffset: 60
        },
        reminderRules: {
          daysBefore: [15, 5, 2],
          channel: 'Email & App'
        }
      }
    ];

    // Seed Compliance Calendar
    this.calendar = [
      {
        _id: 'cal_1',
        templateId: 'tmp_gst_gstr1',
        title: 'GSTR-1 Outward GST Filings - April 2026',
        description: 'Statutory deadline to submit external invoice registries on GSTN ledger.',
        category: 'GST',
        dueDate: new Date('2026-06-11T18:30:00Z'),
        extDueDate: new Date('2026-06-15T18:30:00Z'),
        penaltyAmountMultiplier: 50, // Rs. 50 per day late fee
        frequency: 'Monthly',
        status: 'Upcoming'
      },
      {
        _id: 'cal_2',
        templateId: 'tmp_tds_24q',
        title: 'Form 24Q TDS Salary return submission - Q4 Filing',
        description: 'Deductions record filing for final salaries paid in FY 2025-26.',
        category: 'Income Tax',
        dueDate: new Date('2026-06-31T18:30:00Z'),
        penaltyAmountMultiplier: 200, // Rs. 200 per day under u/s 234E
        frequency: 'Quarterly',
        status: 'Upcoming'
      },
      {
        _id: 'cal_3',
        title: 'Advance Tax Instalment #1 - FY 2026-27',
        description: 'First installment of estimated advance tax payment due (15% of annual liabilities).',
        category: 'Income Tax',
        dueDate: new Date('2026-06-15T18:30:00Z'),
        frequency: 'Quarterly',
        status: 'Upcoming'
      },
      {
        _id: 'cal_4',
        templateId: 'tmp_corp_dir3',
        title: 'DIR-3 KYC Director Annual Verification window',
        description: 'Mandatory verification window ends to avoid DIR status deactivation.',
        category: 'Corporate Law',
        dueDate: new Date('2026-09-30T18:30:00Z'),
        frequency: 'Annual',
        status: 'Upcoming'
      }
    ];

    // Seed Tasks
    this.tasks = [
      {
        _id: 'tsk_101',
        title: 'File GSTR-1 for Alpha Retailers',
        description: 'File outflow registers for supermart invoices totaling GST 2,10,230 INR.',
        clientId: 'cli_alpha',
        assignedTo: 'usr_associate',
        templateId: 'tmp_gst_gstr1',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date('2026-06-11T18:30:00Z'),
        attachments: [],
        comments: [
          { _id: 'c_1', authorId: 'usr_associate', text: 'Started compiling invoices from ERP export.', createdAt: new Date(d.getTime() - 4 * 24 * 3600 * 1000) }
        ],
        createdAt: new Date(d.getTime() - 5 * 24 * 3600 * 1000)
      },
      {
        _id: 'tsk_102',
        title: 'DIR-3 Director KYC - Zenith Biotech',
        description: 'Verify phone/email credentials for 3 separate working directors.',
        clientId: 'cli_zenith',
        assignedTo: 'usr_partner',
        templateId: 'tmp_corp_dir3',
        status: 'Pending',
        priority: 'Medium',
        dueDate: new Date('2026-06-25T18:30:00Z'),
        attachments: [],
        comments: [],
        createdAt: new Date(d.getTime() - 2 * 24 * 3600 * 1000)
      },
      {
        _id: 'tsk_103',
        title: 'Tax Planning Advisory Meeting',
        description: 'Schedule a call with Arun Kumar Mehta to detail long-term capital tax reliefs.',
        clientId: 'cli_mehta',
        assignedTo: 'usr_admin',
        status: 'Completed',
        priority: 'Critical',
        dueDate: new Date(d.getTime() - 1 * 24 * 3600 * 1000), // Due yesterday
        actualCompletionDate: new Date(d.getTime() - 1 * 24 * 3600 * 1000),
        notes: 'Advised client to invest Rs. 1.5L under section 80C and utilize capital gains exemptions under Sec 54.',
        attachments: [],
        comments: [],
        createdAt: new Date(d.getTime() - 12 * 24 * 3600 * 1000)
      },
      {
        _id: 'tsk_104',
        title: 'GST Composition Scheme submission - Sharma Enterprises',
        description: 'Compile gross bill summaries for filing GSTR-4 tax schemes.',
        clientId: 'cli_sharma',
        assignedTo: 'usr_associate',
        status: 'Under Review',
        priority: 'Low',
        dueDate: new Date('2026-06-18T18:30:00Z'),
        attachments: [],
        comments: [],
        createdAt: new Date(d.getTime() - 8 * 24 * 3600 * 1000)
      }
    ];

    // Seed Invoices
    this.invoices = [
      {
        _id: 'inv_201',
        invoiceNumber: 'INV/2026/001',
        clientId: 'cli_alpha',
        issueDate: new Date(d.getTime() - 10 * 24 * 3600 * 1000),
        dueDate: new Date(d.getTime() + 5 * 24 * 3600 * 1000),
        items: [
          { description: 'GST GSTR-1 and GSTR-3B filings (FY 2025-26 Q4 Audit)', amount: 15000, gstRate: 18, feeType: 'Professional' }
        ],
        subtotal: 15000,
        gstAmount: 2700,
        totalAmount: 17700,
        status: 'Sent',
        createdAt: new Date(d.getTime() - 10 * 24 * 3600 * 1000)
      },
      {
        _id: 'inv_202',
        invoiceNumber: 'INV/2026/002',
        clientId: 'cli_zenith',
        issueDate: new Date(d.getTime() - 15 * 24 * 3600 * 1000),
        dueDate: new Date(d.getTime() - 2 * 24 * 3600 * 1000), // Overdue
        items: [
          { description: 'LLP Annual ROC Compliance Filings (Forms 8 & 11)', amount: 25000, gstRate: 18, feeType: 'Government' },
          { description: 'Advisory Consultation Hours on MCA Share Allocations', amount: 8000, gstRate: 18, feeType: 'Professional' }
        ],
        subtotal: 33000,
        gstAmount: 5940,
        totalAmount: 38940,
        status: 'Paid',
        notes: 'Thank you for your prompt business payments.',
        createdAt: new Date(d.getTime() - 15 * 24 * 3600 * 1000)
      },
      {
        _id: 'inv_203',
        invoiceNumber: 'INV/2026/003',
        clientId: 'cli_sharma',
        issueDate: new Date(d.getTime() - 1 * 24 * 3600 * 1000),
        dueDate: new Date(d.getTime() + 14 * 24 * 3600 * 1000),
        items: [
          { description: 'TDS Salary Quarterly deductions compliance submission (Form 24Q)', amount: 5000, gstRate: 18, feeType: 'Government' }
        ],
        subtotal: 5000,
        gstAmount: 900,
        totalAmount: 5900,
        status: 'Draft',
        createdAt: new Date(d.getTime() - 1 * 24 * 3600 * 1000)
      }
    ];

    // Seed Invoice Payments
    this.payments = [
      {
        _id: 'pay_301',
        invoiceId: 'inv_202',
        paymentDate: new Date(d.getTime() - 10 * 24 * 3600 * 1000),
        amount: 38940,
        paymentMethod: 'Bank Transfer',
        transactionId: 'TXN889210293881',
        reference: 'ICICI Current A/c Credit Alert'
      }
    ];

    // Seed Expenses
    this.expenses = [
      {
        _id: 'exp_001',
        title: 'MCA e-Form Filing Portal Government fees',
        category: 'Government Fees',
        amount: 1500,
        spentDate: new Date(d.getTime() - 14 * 24 * 3600 * 1000),
        spentBy: 'usr_partner',
        taskId: 'tsk_102',
        paymentStatus: 'Paid',
        description: 'Challan payment under Zenith LLP ROC records filing.',
        createdAt: new Date(d.getTime() - 14 * 24 * 3600 * 1000)
      },
      {
        _id: 'exp_002',
        title: 'Aadhaar OTP Server Digital Keys Token Subscription',
        category: 'Tech Subscriptions',
        amount: 2500,
        spentDate: new Date(d.getTime() - 5 * 24 * 3600 * 1000),
        spentBy: 'usr_admin',
        paymentStatus: 'Paid',
        description: 'DSC USB hard-token signature replenishment license keys.',
        createdAt: new Date(d.getTime() - 5 * 24 * 3600 * 1000)
      }
    ];

    // Seed Notifications
    this.notifications = [
      {
        _id: 'ntf_1',
        userId: 'usr_associate',
        title: 'New Client Assignment',
        message: 'You have been assigned as the lead tax associate for Zenith Biotech LLP.',
        type: 'system',
        read: false,
        createdAt: new Date(d.getTime() - 2 * 24 * 3600 * 1000)
      },
      {
        _id: 'ntf_2',
        userId: 'usr_associate',
        title: 'High Priority Task Assigned',
        message: 'Task: "File GSTR-1 for Alpha Retailers" has been assigned to your workspace. Deadline is June 11.',
        type: 'task_assigned',
        read: false,
        createdAt: new Date(d.getTime() - 1 * 24 * 3600 * 1000)
      },
      {
        _id: 'ntf_3',
        userId: 'usr_partner',
        title: 'Invoice Payment Received',
        message: 'Zenith Biotech paid INR 38,940 against invoice #INV/2026/002.',
        type: 'payment_received',
        read: true,
        createdAt: new Date(d.getTime() - 10 * 24 * 3600 * 1000)
      }
    ];
  }
}

export const mockDb = new MockDb();
