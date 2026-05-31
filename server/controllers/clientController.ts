import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { mockDb } from '../config/mockDb';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import Client from '../models/Client';
import Contact from '../models/Contact';
import User from '../models/User';
import { ComplianceService } from '../services/complianceService';

// Cast models to any to bypass Mongoose types compiler idiosyncrasies
const ClientModel = Client as any;
const ContactModel = Contact as any;
const UserModel = User as any;

/**
 * Returns true if the live MongoDB database layer is connected and ready.
 */
function isMongoActive(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Lists all client entities with advanced filters, pagination, and text search.
 */
export async function getClients(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, constitution, grade, clientType, search } = req.query;

    // Parse pagination (optional parameter support to prevent breaking client compatibility)
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    if (page !== undefined && (isNaN(page) || page <= 0)) {
      throw new BadRequestError('Page number must be a positive integer.');
    }
    if (limit !== undefined && (isNaN(limit) || limit <= 0)) {
      throw new BadRequestError('Query limit value must be a positive integer.');
    }

    if (isMongoActive()) {
      logger.info('Fetching clients via Live MongoDB.');

      const queryObj: any = {};
      if (status) queryObj.status = status;
      if (constitution) queryObj.constitution = constitution;
      if (grade) queryObj.grade = grade;
      if (clientType) queryObj.clientType = clientType;

      if (search) {
        const qStr = (search as string).trim();
        queryObj.$or = [
          { name: { $regex: qStr, $options: 'i' } },
          { tradeName: { $regex: qStr, $options: 'i' } },
          { pan: { $regex: qStr, $options: 'i' } },
          { tags: { $regex: qStr, $options: 'i' } }
        ];
      }

      const total = await ClientModel.countDocuments(queryObj);
      let dbQuery = ClientModel.find(queryObj).sort({ createdAt: -1 });

      if (page !== undefined && limit !== undefined) {
        const skip = (page - 1) * limit;
        dbQuery = dbQuery.skip(skip).limit(limit);
      }

      const dbClients = await dbQuery;
      const results = [];

      for (const client of dbClients) {
        const clientId = client._id;
        const contacts = await ContactModel.find({ clientId });
        
        let assignedToUser = null;
        if (client.assignedTo) {
          const assigned = await UserModel.findById(client.assignedTo).select('fullName email role');
          if (assigned) {
            assignedToUser = {
              id: assigned._id,
              fullName: assigned.fullName,
              email: assigned.email,
              role: assigned.role
            };
          }
        }

        results.push({
          ...client.toObject(),
          assignedToUser,
          contactsCount: contacts.length,
          contacts
        });
      }

      res.status(200).json({
        status: 'success',
        results: results.length,
        pagination: page !== undefined && limit !== undefined ? {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        } : undefined,
        data: { clients: results }
      });
    } else {
      logger.info('Fetching clients via Memory Sandbox fallback.');

      let filtered = [...mockDb.clients];

      if (status) {
        filtered = filtered.filter(c => c.status === status);
      }
      if (constitution) {
        filtered = filtered.filter(c => c.constitution === constitution);
      }
      if (grade) {
        filtered = filtered.filter(c => c.grade === grade);
      }
      if (clientType) {
        filtered = filtered.filter(c => c.clientType === clientType);
      }
      if (search) {
        const qStr = (search as string).toLowerCase().trim();
        filtered = filtered.filter(
          c => c.name.toLowerCase().includes(qStr) || 
               (c.tradeName && c.tradeName.toLowerCase().includes(qStr)) ||
               c.pan.toLowerCase().includes(qStr) ||
               (c.tags && c.tags.some((t: string) => t.toLowerCase().includes(qStr)))
        );
      }

      const total = filtered.length;

      // Newest first sorting
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      let paginated = filtered;
      if (page !== undefined && limit !== undefined) {
        const skip = (page - 1) * limit;
        paginated = filtered.slice(skip, skip + limit);
      }

      const results = paginated.map(client => {
        const assignedUser = mockDb.users.find(u => u._id === client.assignedTo);
        const contacts = mockDb.contacts.filter(con => con.clientId === client._id);
        
        return {
          ...client,
          assignedToUser: assignedUser ? {
            id: assignedUser._id,
            fullName: assignedUser.fullName,
            email: assignedUser.email,
            role: assignedUser.role
          } : null,
          contactsCount: contacts.length,
          contacts
        };
      });

      res.status(200).json({
        status: 'success',
        results: results.length,
        pagination: page !== undefined && limit !== undefined ? {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        } : undefined,
        data: { clients: results }
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch a single client entity by their ID.
 */
export async function getClientById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Invalid client identifier format.');
      }

      const client = await ClientModel.findById(id);
      if (!client) {
        throw new NotFoundError('Client entity does not exist.');
      }

      const contacts = await ContactModel.find({ clientId: client._id });
      let assignedToUser = null;

      if (client.assignedTo) {
        const assigned = await UserModel.findById(client.assignedTo).select('fullName email role');
        if (assigned) {
          assignedToUser = {
            id: assigned._id,
            fullName: assigned.fullName,
            email: assigned.email,
            role: assigned.role
          };
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          client: {
            ...client.toObject(),
            assignedToUser,
            contactsCount: contacts.length,
            contacts
          }
        }
      });
    } else {
      const client = mockDb.clients.find(c => c._id === id);
      if (!client) {
        throw new NotFoundError('Client entity does not exist.');
      }

      const assignedUser = mockDb.users.find(u => u._id === client.assignedTo);
      const contacts = mockDb.contacts.filter(con => con.clientId === client._id);

      res.status(200).json({
        status: 'success',
        data: {
          client: {
            ...client,
            assignedToUser: assignedUser ? {
              id: assignedUser._id,
              fullName: assignedUser.fullName,
              role: assignedUser.role,
              email: assignedUser.email
            } : null,
            contactsCount: contacts.length,
            contacts
          }
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a brand new client with nested contacts.
 */
export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, tradeName, constitution, pan, gstType, filingFrequency, assignedTo, tags, grade, clientType, contacts } = req.body;

    logger.info(`Creating brand new client record: ${name}`);

    // High fidelity parameter schema validation back guard
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestError('Client Name represents standard business identity and cannot be blank.');
    }
    if (!constitution || typeof constitution !== 'string') {
      throw new BadRequestError('Constitution structure details are required.');
    }
    if (!pan || typeof pan !== 'string') {
      throw new BadRequestError('Permanent Account Number (PAN) is mandatory.');
    }

    const uppercasePan = pan.toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(uppercasePan)) {
      throw new BadRequestError('Invalid PAN format! Must match Indian tax regulations (e.g., AAACA1234F).');
    }

    if (isMongoActive()) {
      // Check PAN uniqueness
      const isPanTaken = await ClientModel.findOne({ pan: uppercasePan });
      if (isPanTaken) {
        throw new BadRequestError(`Duplicate PAN found. The client PAN details (${uppercasePan}) are already claimed.`);
      }

      // Check assigned user existence
      if (assignedTo) {
        const userExists = await UserModel.findById(assignedTo);
        if (!userExists) {
          throw new BadRequestError(`Assigned user (${assignedTo}) does not exist.`);
        }
      }

      const newClient = new ClientModel({
        name,
        tradeName,
        constitution: constitution as any,
        pan: uppercasePan,
        gstType: gstType || 'None',
        filingFrequency: filingFrequency || 'None',
        assignedTo: assignedTo || undefined,
        tags: tags || [],
        status: 'active',
        grade: grade || 'B',
        clientType: clientType || 'SME'
      });

      await newClient.save();

      const savedContacts = [];
      if (contacts && Array.isArray(contacts)) {
        for (let i = 0; i < contacts.length; i++) {
          const c = contacts[i];
          if (c.name && c.email && c.phone) {
            const isPrimary = c.isPrimary !== undefined ? !!c.isPrimary : (i === 0);
            const newContact = new ContactModel({
              clientId: newClient._id,
              name: c.name,
              designation: c.designation || '',
              email: c.email.toLowerCase(),
              phone: c.phone,
              isPrimary,
              alternatePhone: c.alternatePhone || ''
            });
            await newContact.save();
            savedContacts.push(newContact.toObject());
          }
        }
      }

      // Sync backend sandbox memory to maintain integrity
      const mockClientObj: any = {
        _id: newClient._id.toString(),
        name,
        tradeName,
        constitution: constitution as any,
        pan: uppercasePan,
        gstType: (gstType || 'None') as any,
        filingFrequency: (filingFrequency || 'None') as any,
        assignedTo: assignedTo || undefined,
        tags: tags || [],
        status: 'active' as any,
        grade: (grade || 'B') as any,
        clientType: (clientType || 'SME') as any,
        createdAt: newClient.createdAt
      };
      mockDb.clients.push(mockClientObj);

      savedContacts.forEach((sc: any) => {
        const mockContactObj: any = {
          _id: sc._id.toString(),
          clientId: newClient._id.toString(),
          name: sc.name,
          designation: sc.designation,
          email: sc.email,
          phone: sc.phone,
          isPrimary: sc.isPrimary,
          alternatePhone: sc.alternatePhone,
          createdAt: sc.createdAt || new Date()
        };
        mockDb.contacts.push(mockContactObj);
      });

      // Generate automated compliance tasks
      const generatedCompliance = await ComplianceService.generateAutoTasksForClient(newClient);
      logger.info(`Automatically created ${generatedCompliance.length} compliance checklist tasks for newly registered ${constitution} entity in MongoDB.`);

      logger.info(`Client created successfully in MongoDB: ${newClient.name} (${newClient._id})`);

      res.status(201).json({
        status: 'success',
        data: {
          client: {
            ...newClient.toObject(),
            contactsCount: savedContacts.length,
            contacts: savedContacts
          }
        }
      });
    } else {
      // Memory Sandbox fallback creation
      const isPanTaken = mockDb.clients.some(c => c.pan.toUpperCase() === uppercasePan);
      if (isPanTaken) {
        throw new BadRequestError(`Duplicate PAN found. The client PAN details (${uppercasePan}) are already claimed.`);
      }

      const newClientId = `cli_${Date.now()}`;
      const newClient: any = {
        _id: newClientId,
        name,
        tradeName,
        constitution: constitution as any,
        pan: uppercasePan,
        gstType: (gstType || 'None') as any,
        filingFrequency: (filingFrequency || 'None') as any,
        assignedTo: assignedTo || undefined,
        tags: tags || [],
        status: 'active' as any,
        grade: (grade || 'B') as any,
        clientType: (clientType || 'SME') as any,
        createdAt: new Date()
      };

      mockDb.clients.push(newClient);

      const savedContacts: any[] = [];
      if (contacts && Array.isArray(contacts)) {
        contacts.forEach((c: any, index: number) => {
          if (c.name && c.email && c.phone) {
            const primaryVal = c.isPrimary !== undefined ? !!c.isPrimary : (index === 0);
            const contactObj : any = {
              _id: `con_${Date.now()}_${index}`,
              clientId: newClientId,
              name: c.name,
              designation: c.designation || '',
              email: c.email.toLowerCase(),
              phone: c.phone,
              isPrimary: primaryVal,
              alternatePhone: c.alternatePhone || '',
              createdAt: new Date()
            };
            mockDb.contacts.push(contactObj);
            savedContacts.push(contactObj);
          }
        });
      }

      // Generate automated compliance tasks for fallback
      const generatedCompliance = await ComplianceService.generateAutoTasksForClient(newClient);
      logger.info(`Automatically created ${generatedCompliance.length} compliance checklist tasks for newly registered ${constitution} entity in Memory.`);

      logger.info(`Client created successfully in Memory fallback: ${newClient.name} (${newClient._id})`);

      res.status(201).json({
        status: 'success',
        data: {
          client: {
            ...newClient,
            contactsCount: savedContacts.length,
            contacts: savedContacts
          }
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing client details and syncs associated contact points.
 */
export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, tradeName, constitution, pan, gstType, filingFrequency, assignedTo, tags, status, grade, clientType, contacts } = req.body;

    logger.info(`Updating client entity detail for ID: ${id}`);

    if (isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Invalid client identifier format.');
      }

      const client = await ClientModel.findById(id);
      if (!client) {
        throw new NotFoundError('Client entity does not exist.');
      }

      if (pan) {
        const uppercasePan = pan.toUpperCase();
        if (uppercasePan !== client.pan) {
          const isPanTaken = await ClientModel.findOne({ _id: { $ne: id }, pan: uppercasePan });
          if (isPanTaken) {
            throw new BadRequestError('The updated PAN address is already registered under another client entity.');
          }
        }
        client.pan = uppercasePan;
      }

      if (assignedTo) {
        const userExists = await UserModel.findById(assignedTo);
        if (!userExists) {
          throw new BadRequestError(`Assigned user (${assignedTo}) does not exist.`);
        }
        client.assignedTo = assignedTo;
      } else if (assignedTo === null) {
        client.assignedTo = undefined;
      }

      if (name !== undefined) client.name = name;
      if (tradeName !== undefined) client.tradeName = tradeName;
      if (constitution !== undefined) client.constitution = constitution as any;
      if (gstType !== undefined) client.gstType = gstType as any;
      if (filingFrequency !== undefined) client.filingFrequency = filingFrequency as any;
      if (tags !== undefined) client.tags = tags;
      if (status !== undefined) client.status = status as any;
      if (grade !== undefined) client.grade = grade as any;
      if (clientType !== undefined) client.clientType = clientType as any;

      await client.save();

      if (contacts && Array.isArray(contacts)) {
        await ContactModel.deleteMany({ clientId: id });

        for (let i = 0; i < contacts.length; i++) {
          const c = contacts[i];
          if (c.name && c.email && c.phone) {
            const isPrimary = c.isPrimary !== undefined ? !!c.isPrimary : (i === 0);
            const newContact = new ContactModel({
              clientId: id,
              name: c.name,
              designation: c.designation || '',
              email: c.email.toLowerCase(),
              phone: c.phone,
              isPrimary,
              alternatePhone: c.alternatePhone || ''
            });
            await newContact.save();
          }
        }
      }

      const finalContacts = await ContactModel.find({ clientId: id });

      // Keeps sandbox mockDb synced for integrity
      const mockIndex = mockDb.clients.findIndex(c => c._id === id);
      if (mockIndex !== -1) {
        mockDb.clients[mockIndex] = {
          ...mockDb.clients[mockIndex],
          name: client.name,
          tradeName: client.tradeName,
          constitution: client.constitution as any,
          pan: client.pan,
          gstType: client.gstType as any,
          filingFrequency: client.filingFrequency as any,
          assignedTo: client.assignedTo ? client.assignedTo.toString() : undefined,
          tags: client.tags,
          status: client.status as any,
          grade: client.grade as any,
          clientType: client.clientType as any
        };

        mockDb.contacts = mockDb.contacts.filter(c => c.clientId !== id);
        finalContacts.forEach(fc => {
          const mContactObj: any = {
            _id: fc._id.toString(),
            clientId: id,
            name: fc.name,
            designation: fc.designation,
            email: fc.email,
            phone: fc.phone,
            isPrimary: fc.isPrimary,
            alternatePhone: fc.alternatePhone,
            createdAt: fc.createdAt || new Date()
          };
          mockDb.contacts.push(mContactObj);
        });
      }

      logger.info(`Client updated successfully in MongoDB: ${client.name}`);

      res.status(200).json({
        status: 'success',
        data: {
          client: {
            ...client.toObject(),
            contacts: finalContacts,
            contactsCount: finalContacts.length
          }
        }
      });
    } else {
      const clientIndex = mockDb.clients.findIndex(c => c._id === id);
      if (clientIndex === -1) {
        throw new NotFoundError('Client entity does not exist.');
      }

      if (pan && pan.toUpperCase() !== mockDb.clients[clientIndex].pan) {
        const uppercasePan = pan.toUpperCase();
        const isPanTaken = mockDb.clients.some(c => c._id !== id && c.pan.toUpperCase() === uppercasePan);
        if (isPanTaken) {
          throw new BadRequestError('The updated PAN address is already registered under another client entity.');
        }
      }

      const updatedClient: any = {
        ...mockDb.clients[clientIndex],
        name: name !== undefined ? name : mockDb.clients[clientIndex].name,
        tradeName: tradeName !== undefined ? tradeName : mockDb.clients[clientIndex].tradeName,
        constitution: constitution !== undefined ? (constitution as any) : mockDb.clients[clientIndex].constitution,
        pan: pan ? pan.toUpperCase() : mockDb.clients[clientIndex].pan,
        gstType: gstType !== undefined ? (gstType as any) : mockDb.clients[clientIndex].gstType,
        filingFrequency: filingFrequency !== undefined ? (filingFrequency as any) : mockDb.clients[clientIndex].filingFrequency,
        assignedTo: assignedTo !== undefined ? (assignedTo === null ? undefined : assignedTo) : mockDb.clients[clientIndex].assignedTo,
        tags: tags !== undefined ? tags : mockDb.clients[clientIndex].tags,
        status: status !== undefined ? (status as any) : mockDb.clients[clientIndex].status,
        grade: grade !== undefined ? (grade as any) : mockDb.clients[clientIndex].grade,
        clientType: clientType !== undefined ? (clientType as any) : mockDb.clients[clientIndex].clientType
      };

      mockDb.clients[clientIndex] = updatedClient;

      if (contacts && Array.isArray(contacts)) {
        mockDb.contacts = mockDb.contacts.filter(c => c.clientId !== id);
        contacts.forEach((c: any, index: number) => {
          if (c.name && c.email && c.phone) {
            mockDb.contacts.push({
              _id: `con_${Date.now()}_${index}`,
              clientId: id,
              name: c.name,
              designation: c.designation || '',
              email: c.email.toLowerCase(),
              phone: c.phone,
              isPrimary: c.isPrimary !== undefined ? !!c.isPrimary : (index === 0),
              alternatePhone: c.alternatePhone || '',
              createdAt: new Date()
            });
          }
        });
      }

      const finalContacts = mockDb.contacts.filter(c => c.clientId === id);

      logger.info(`Client updated successfully in Memory fallback: ${updatedClient.name}`);

      res.status(200).json({
        status: 'success',
        data: {
          client: {
            ...updatedClient,
            contacts: finalContacts,
            contactsCount: finalContacts.length
          }
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Appends a contact card to a client entity.
 */
export async function addContact(req: Request, res: Response, next: NextFunction) {
  try {
    const { clientId } = req.params;
    const { name, designation, email, phone, isPrimary, alternatePhone } = req.body;

    if (!name || !email || !phone) {
      throw new BadRequestError('Fields [name, email, phone] are mandatory to bind contacts.');
    }

    if (isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        throw new BadRequestError('Invalid client identifier format.');
      }

      const client = await ClientModel.findById(clientId);
      if (!client) {
        throw new NotFoundError('Client entity does not exist.');
      }

      if (isPrimary) {
        await ContactModel.updateMany({ clientId }, { isPrimary: false });
      }

      const newContact = new ContactModel({
        clientId,
        name,
        designation: designation || '',
        email: email.toLowerCase(),
        phone,
        isPrimary: !!isPrimary,
        alternatePhone: alternatePhone || ''
      });

      await newContact.save();

      // Sync backend sandbox memory
      mockDb.contacts.push({
        _id: newContact._id.toString(),
        clientId,
        name,
        designation,
        email: email.toLowerCase(),
        phone,
        isPrimary: !!isPrimary,
        alternatePhone,
        createdAt: new Date()
      });

      logger.info(`Contact appended successfully via MongoDB for client ${client.name}`);

      res.status(201).json({
        status: 'success',
        data: { contact: newContact.toObject() }
      });
    } else {
      const client = mockDb.clients.find(c => c._id === clientId);
      if (!client) {
        throw new NotFoundError('Client entity does not exist.');
      }

      if (isPrimary) {
        mockDb.contacts
          .filter(c => c.clientId === clientId)
          .forEach(c => c.isPrimary = false);
      }

      const newContact = {
        _id: `con_${Date.now()}`,
        clientId,
        name,
        designation,
        email: email.toLowerCase(),
        phone,
        isPrimary: !!isPrimary,
        alternatePhone,
        createdAt: new Date()
      };

      mockDb.contacts.push(newContact);

      logger.info(`Contact appended successfully via Memory fallback for client ${client.name}`);

      res.status(201).json({
        status: 'success',
        data: { contact: newContact }
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Cascades removal of a client alongside their related contact cards.
 */
export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    logger.info(`Deleting client record for ID: ${id}`);

    if (isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Invalid client identifier format.');
      }

      const client = await ClientModel.findById(id);
      if (!client) {
        throw new NotFoundError('Client record not found.');
      }

      await ClientModel.deleteOne({ _id: id });
      await ContactModel.deleteMany({ clientId: id });

      const clientIndex = mockDb.clients.findIndex(c => c._id === id);
      if (clientIndex !== -1) {
        mockDb.clients.splice(clientIndex, 1);
      }
      mockDb.contacts = mockDb.contacts.filter(c => c.clientId !== id);

      logger.info(`Client cascades successfully removed in MongoDB: ${id}`);

      res.status(200).json({
        status: 'success',
        message: 'Client removed successfully.'
      });
    } else {
      const clientIndex = mockDb.clients.findIndex(c => c._id === id);
      if (clientIndex === -1) {
        throw new NotFoundError('Client record not found.');
      }

      mockDb.clients.splice(clientIndex, 1);
      mockDb.contacts = mockDb.contacts.filter(c => c.clientId !== id);

      logger.info(`Client cascades successfully removed in Memory fallback: ${id}`);

      res.status(200).json({
        status: 'success',
        message: 'Client removed successfully.'
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk import multiple client directories with comprehensive data validation reporting
 */
export async function bulkImportClients(req: Request, res: Response, next: NextFunction) {
  try {
    const { clients } = req.body;
    if (!clients || !Array.isArray(clients)) {
      throw new BadRequestError('An array of client objects is required to perform a bulk directory import.');
    }

    const results = {
      total: clients.length,
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; name: string; error: string }[]
    };

    if (isMongoActive()) {
      for (let i = 0; i < clients.length; i++) {
        const c = clients[i];
        const rowNum = i + 1;
        try {
          if (!c.name || typeof c.name !== 'string' || c.name.trim().length === 0) {
            throw new Error('Client Legal Name is mandatory.');
          }
          if (!c.constitution) {
            throw new Error('Entity legal Constitution is mandatory.');
          }
          
          const validConstitutions = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Individual'];
          const normConstitution = validConstitutions.find(
            item => item.toLowerCase() === c.constitution.trim().toLowerCase()
          );
          if (!normConstitution) {
            throw new Error(`Invalid constitution "${c.constitution}". Supported values: ${validConstitutions.join(', ')}`);
          }

          if (!c.pan) {
            throw new Error('Permanent Account Number (PAN) is required for compliance registry.');
          }
          const uppercasePan = c.pan.toUpperCase().trim();
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panRegex.test(uppercasePan)) {
            throw new Error(`Invalid PAN format "${uppercasePan}". Regulation requires standard 10-char alphanumeric string.`);
          }

          // Search duplicate PAN database-wide
          const alreadyExists = await ClientModel.findOne({ pan: uppercasePan });
          if (alreadyExists) {
            throw new Error(`Duplicate PAN clash: A client "${alreadyExists.name}" is already registered using ${uppercasePan}.`);
          }

          // Try resolving account owner assignment to teammate
          let assignedToId = undefined;
          if (c.assignedTo) {
            if (mongoose.Types.ObjectId.isValid(c.assignedTo)) {
              assignedToId = c.assignedTo;
            } else {
              const userMatch = await UserModel.findOne({
                $or: [
                  { fullName: { $regex: new RegExp(`^${c.assignedTo.trim()}$`, 'i') } },
                  { email: { $regex: new RegExp(`^${c.assignedTo.trim()}$`, 'i') } }
                ]
              });
              if (userMatch) {
                assignedToId = userMatch._id;
              }
            }
          }

          // Norm grade
          let gradeVal = 'B';
          if (c.grade && ['A', 'B', 'C', 'D'].includes(c.grade.toUpperCase().trim())) {
            gradeVal = c.grade.toUpperCase().trim();
          }

          // Norm Client Type
          let clientTypeVal = 'SME';
          const validTypes = ['Corporate', 'Retail', 'HNW', 'SME', 'Others'];
          const matchedType = validTypes.find(vt => vt.toLowerCase() === (c.clientType || '').trim().toLowerCase());
          if (matchedType) {
            clientTypeVal = matchedType;
          }

          // Norm GST system
          let gstVal = 'None';
          const validGsts = ['Regular', 'Composition', 'Unregistered', 'None'];
          const matchedGst = validGsts.find(vg => vg.toLowerCase() === (c.gstType || '').trim().toLowerCase());
          if (matchedGst) {
            gstVal = matchedGst;
          }

          // Norm Filing frequency
          let freqVal = 'None';
          const validFreqs = ['Monthly', 'Quarterly', 'None'];
          const matchedFreq = validFreqs.find(vf => vf.toLowerCase() === (c.filingFrequency || '').trim().toLowerCase());
          if (matchedFreq) {
            freqVal = matchedFreq;
          }

          const parsedClient = new ClientModel({
            name: c.name.trim(),
            tradeName: c.tradeName ? c.tradeName.trim() : undefined,
            constitution: normConstitution,
            pan: uppercasePan,
            gstType: gstVal,
            filingFrequency: freqVal,
            assignedTo: assignedToId,
            tags: Array.isArray(c.tags) ? c.tags : (c.tags ? String(c.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
            status: c.status === 'inactive' ? 'inactive' : 'active',
            grade: gradeVal,
            clientType: clientTypeVal
          });

          await parsedClient.save();

          // Standard Primary Contact point creation sequence if included
          if (c.contactName || c.contactEmail || c.contactPhone) {
            const newContact = new ContactModel({
              clientId: parsedClient._id,
              name: (c.contactName || c.name || 'Accounts Rep').trim(),
              designation: (c.contactDesignation || 'Primary Representative').trim(),
              email: (c.contactEmail || `billing@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`).trim().toLowerCase(),
              phone: (c.contactPhone || '0000000000').trim(),
              isPrimary: true
            });
            await newContact.save();
          }

          // Keep Memory sandbox synchronized for visual sandbox reliability
          const mockObj: any = {
            ...parsedClient.toObject(),
            _id: parsedClient._id.toString()
          };
          mockDb.clients.push(mockObj);

          results.imported++;
        } catch (err: any) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            name: c.name || `Record Row #${rowNum}`,
            error: err.message || 'Validation error'
          });
        }
      }
    } else {
      // Memory sandbox fallback processing loops for demo/preview servers
      for (let i = 0; i < clients.length; i++) {
        const c = clients[i];
        const rowNum = i + 1;
        try {
          if (!c.name || typeof c.name !== 'string' || c.name.trim().length === 0) {
            throw new Error('Client Legal Name is mandatory.');
          }
          if (!c.constitution) {
            throw new Error('Entity legal Constitution is mandatory.');
          }
          
          const validConstitutions = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Individual'];
          const normConstitution = validConstitutions.find(
            item => item.toLowerCase() === c.constitution.trim().toLowerCase()
          );
          if (!normConstitution) {
            throw new Error(`Invalid constitution "${c.constitution}". Supported values: ${validConstitutions.join(', ')}`);
          }

          if (!c.pan) {
            throw new Error('Permanent Account Number (PAN) is required for compliance registry.');
          }
          const uppercasePan = c.pan.toUpperCase().trim();
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panRegex.test(uppercasePan)) {
            throw new Error(`Invalid PAN format "${uppercasePan}". Regulation requires standard 10-char alphanumeric string.`);
          }

          const alreadyExists = mockDb.clients.some(mc => mc.pan.toUpperCase() === uppercasePan);
          if (alreadyExists) {
            throw new Error(`Duplicate PAN clash: A client PAN "${uppercasePan}" is already claimed.`);
          }

          let assignedToId = undefined;
          if (c.assignedTo) {
            const matchedUser = mockDb.users.find(u => 
              u.fullName.toLowerCase() === c.assignedTo.trim().toLowerCase() ||
              u.email.toLowerCase() === c.assignedTo.trim().toLowerCase() ||
              u._id === c.assignedTo
            );
            if (matchedUser) {
              assignedToId = matchedUser._id;
            }
          }

          let gradeVal = 'B';
          if (c.grade && ['A', 'B', 'C', 'D'].includes(c.grade.toUpperCase().trim())) {
            gradeVal = c.grade.toUpperCase().trim();
          }

          let clientTypeVal = 'SME';
          const validTypes = ['Corporate', 'Retail', 'HNW', 'SME', 'Others'];
          const matchedType = validTypes.find(vt => vt.toLowerCase() === (c.clientType || '').trim().toLowerCase());
          if (matchedType) {
            clientTypeVal = matchedType;
          }

          let gstVal = 'None';
          const validGsts = ['Regular', 'Composition', 'Unregistered', 'None'];
          const matchedGst = validGsts.find(vg => vg.toLowerCase() === (c.gstType || '').trim().toLowerCase());
          if (matchedGst) {
            gstVal = matchedGst;
          }

          let freqVal = 'None';
          const validFreqs = ['Monthly', 'Quarterly', 'None'];
          const matchedFreq = validFreqs.find(vf => vf.toLowerCase() === (c.filingFrequency || '').trim().toLowerCase());
          if (matchedFreq) {
            freqVal = matchedFreq;
          }

          const mockClientId = `cli_bk_${Date.now()}_${i}`;
          const newMock: any = {
            _id: mockClientId,
            name: c.name.trim(),
            tradeName: c.tradeName ? c.tradeName.trim() : undefined,
            constitution: normConstitution,
            pan: uppercasePan,
            gstType: gstVal,
            filingFrequency: freqVal,
            assignedTo: assignedToId,
            tags: Array.isArray(c.tags) ? c.tags : (c.tags ? String(c.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
            status: c.status === 'inactive' ? 'inactive' : 'active',
            grade: gradeVal,
            clientType: clientTypeVal,
            createdAt: new Date()
          };

          mockDb.clients.push(newMock);

          if (c.contactName || c.contactEmail || c.contactPhone) {
            mockDb.contacts.push({
              _id: `con_bk_${Date.now()}_${i}`,
              clientId: mockClientId,
              name: (c.contactName || c.name || 'Accounts Rep').trim(),
              designation: (c.contactDesignation || 'Primary Representative').trim(),
              email: (c.contactEmail || `billing@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`).trim().toLowerCase(),
              phone: (c.contactPhone || '0000000000').trim(),
              isPrimary: true,
              createdAt: new Date()
            });
          }

          results.imported++;
        } catch (err: any) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            name: c.name || `Record Row #${rowNum}`,
            error: err.message || 'Validation error'
          });
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (err) {
    next(err);
  }
}

