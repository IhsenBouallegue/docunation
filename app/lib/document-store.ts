import type { DocumentAnalysis } from "../actions/analyze-document";

export interface StoredDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadDate: Date;
  lastAccessed?: Date;
  category?: string;
  tags: string[];
  analysis?: DocumentAnalysis;
  applicationIds?: string[]; // References to applications using this document
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
  version: number;
  previousVersions?: string[]; // References to previous versions of this document
}

export interface DocumentQuery {
  text?: string;
  documentType?: string;
  tags?: string[];
  category?: string;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  isVerified?: boolean;
  applicationId?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  documents: string[]; // Document IDs
  createdAt: Date;
  updatedAt: Date;
  parentFolderId?: string;
  isSystem: boolean;
  icon?: string;
}

// In a real application, this would be a database
class DocumentStore {
  private documents: Map<string, StoredDocument> = new Map();
  private folders: Map<string, DocumentFolder> = new Map();

  // Initialize the store with default folders
  constructor() {
    // Create system folders
    const personalDocsFolder: DocumentFolder = {
      id: crypto.randomUUID(),
      name: "Personal Documents",
      description: "Identity documents and personal records",
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      icon: "user",
    };

    const financialDocsFolder: DocumentFolder = {
      id: crypto.randomUUID(),
      name: "Financial Documents",
      description: "Bank statements, tax documents, and financial records",
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      icon: "dollar-sign",
    };

    const travelDocsFolder: DocumentFolder = {
      id: crypto.randomUUID(),
      name: "Travel Documents",
      description: "Passports, visas, and travel-related documentation",
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: true,
      icon: "plane",
    };

    // Add folders to the store
    this.folders.set(personalDocsFolder.id, personalDocsFolder);
    this.folders.set(financialDocsFolder.id, financialDocsFolder);
    this.folders.set(travelDocsFolder.id, travelDocsFolder);
  }

  // Store a document with its analysis
  async addDocument(
    fileName: string,
    fileUrl: string,
    fileSize: number,
    fileType: string,
    analysis?: DocumentAnalysis,
    tags: string[] = [],
  ): Promise<StoredDocument> {
    // Create new document record
    const doc: StoredDocument = {
      id: crypto.randomUUID(),
      fileName,
      fileUrl,
      fileSize,
      fileType,
      uploadDate: new Date(),
      tags: [...tags],
      isVerified: false,
      version: 1,
    };

    // If analysis is provided, add it and use its tags
    if (analysis) {
      doc.analysis = analysis;
      doc.tags = [...doc.tags, ...analysis.tags];

      // Auto-categorize document based on type
      if (analysis.documentType === "passport" || analysis.documentType === "id_card") {
        const folder = this.getFolderByName("Travel Documents");
        if (folder) {
          folder.documents.push(doc.id);
          this.folders.set(folder.id, folder);
        }
      } else if (analysis.documentType === "bank_statement" || analysis.documentType === "tax_return") {
        const folder = this.getFolderByName("Financial Documents");
        if (folder) {
          folder.documents.push(doc.id);
          this.folders.set(folder.id, folder);
        }
      } else {
        // Default to personal documents
        const folder = this.getFolderByName("Personal Documents");
        if (folder) {
          folder.documents.push(doc.id);
          this.folders.set(folder.id, folder);
        }
      }
    }

    // Store the document
    this.documents.set(doc.id, doc);
    return doc;
  }

  // Get a document by ID
  getDocument(id: string): StoredDocument | undefined {
    const doc = this.documents.get(id);
    if (doc) {
      // Update last accessed time
      doc.lastAccessed = new Date();
      this.documents.set(id, doc);
    }
    return doc;
  }

  // Update a document (e.g. after verification)
  updateDocument(id: string, updates: Partial<StoredDocument>): StoredDocument | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    // Apply updates
    const updatedDoc = { ...doc, ...updates };
    this.documents.set(id, updatedDoc);
    return updatedDoc;
  }

  // Create a new version of a document
  createNewVersion(
    oldDocId: string,
    fileUrl: string,
    fileSize: number,
    analysis?: DocumentAnalysis,
  ): StoredDocument | undefined {
    const oldDoc = this.documents.get(oldDocId);
    if (!oldDoc) return undefined;

    // Create new document with version incremented
    const newDoc: StoredDocument = {
      id: crypto.randomUUID(),
      fileName: oldDoc.fileName,
      fileUrl,
      fileSize,
      fileType: oldDoc.fileType,
      uploadDate: new Date(),
      tags: [...oldDoc.tags],
      analysis,
      applicationIds: [...(oldDoc.applicationIds || [])],
      isVerified: false,
      version: oldDoc.version + 1,
      previousVersions: [oldDocId, ...(oldDoc.previousVersions || [])],
    };

    // Store new version
    this.documents.set(newDoc.id, newDoc);

    // Replace document in any folders it belongs to
    for (const [folderId, folder] of this.folders.entries()) {
      if (folder.documents.includes(oldDocId)) {
        folder.documents = folder.documents.map((id) => (id === oldDocId ? newDoc.id : id));
        folder.updatedAt = new Date();
        this.folders.set(folderId, folder);
      }
    }

    return newDoc;
  }

  // Search for documents
  searchDocuments(query: DocumentQuery): StoredDocument[] {
    const results: StoredDocument[] = [];

    for (const doc of this.documents.values()) {
      let matches = true;

      // Check text search (across filename, extracted text, and entities)
      if (query.text) {
        const textLower = query.text.toLowerCase();
        const hasTextMatch =
          doc.fileName.toLowerCase().includes(textLower) ||
          doc.analysis?.extractedText.toLowerCase().includes(textLower) ||
          doc.analysis?.entities.some((e) => e.value.toLowerCase().includes(textLower));

        if (!hasTextMatch) {
          matches = false;
        }
      }

      // Check document type
      if (query.documentType && doc.analysis?.documentType !== query.documentType) {
        matches = false;
      }

      // Check tags - document must have ALL requested tags
      if (query.tags && query.tags.length > 0) {
        if (!query.tags.every((tag) => doc.tags.includes(tag))) {
          matches = false;
        }
      }

      // Check category
      if (query.category && doc.category !== query.category) {
        matches = false;
      }

      // Check upload date range
      if (query.uploadedAfter && doc.uploadDate < query.uploadedAfter) {
        matches = false;
      }
      if (query.uploadedBefore && doc.uploadDate > query.uploadedBefore) {
        matches = false;
      }

      // Check verification status
      if (query.isVerified !== undefined && doc.isVerified !== query.isVerified) {
        matches = false;
      }

      // Check if used in a specific application
      if (query.applicationId && !doc.applicationIds?.includes(query.applicationId)) {
        matches = false;
      }

      if (matches) {
        results.push(doc);
      }
    }

    // Sort by relevance (most recently uploaded first)
    return results.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  }

  // Get all documents
  getAllDocuments(): StoredDocument[] {
    return Array.from(this.documents.values());
  }

  // Get documents by folder
  getDocumentsByFolder(folderId: string): StoredDocument[] {
    const folder = this.folders.get(folderId);
    if (!folder) return [];

    return folder.documents
      .map((id) => this.documents.get(id))
      .filter((doc): doc is StoredDocument => doc !== undefined);
  }

  // Create a new folder
  createFolder(name: string, description?: string, parentFolderId?: string): DocumentFolder {
    const folder: DocumentFolder = {
      id: crypto.randomUUID(),
      name,
      description,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      parentFolderId,
      isSystem: false,
    };

    this.folders.set(folder.id, folder);
    return folder;
  }

  // Get a folder by ID
  getFolder(id: string): DocumentFolder | undefined {
    return this.folders.get(id);
  }

  // Get a folder by name
  getFolderByName(name: string): DocumentFolder | undefined {
    for (const folder of this.folders.values()) {
      if (folder.name === name) {
        return folder;
      }
    }
    return undefined;
  }

  // Get all folders
  getAllFolders(): DocumentFolder[] {
    return Array.from(this.folders.values());
  }

  // Add a document to a folder
  addDocumentToFolder(documentId: string, folderId: string): boolean {
    const folder = this.folders.get(folderId);
    const document = this.documents.get(documentId);

    if (!folder || !document) return false;

    // Add document to folder if not already there
    if (!folder.documents.includes(documentId)) {
      folder.documents.push(documentId);
      folder.updatedAt = new Date();
      this.folders.set(folderId, folder);
    }

    return true;
  }

  // Remove a document from a folder
  removeDocumentFromFolder(documentId: string, folderId: string): boolean {
    const folder = this.folders.get(folderId);
    if (!folder) return false;

    // Remove document from folder
    const index = folder.documents.indexOf(documentId);
    if (index !== -1) {
      folder.documents.splice(index, 1);
      folder.updatedAt = new Date();
      this.folders.set(folderId, folder);
      return true;
    }

    return false;
  }

  // Associate a document with an application
  associateDocumentWithApplication(documentId: string, applicationId: string): boolean {
    const doc = this.documents.get(documentId);
    if (!doc) return false;

    // Add application to document's applications
    if (!doc.applicationIds) {
      doc.applicationIds = [];
    }

    if (!doc.applicationIds.includes(applicationId)) {
      doc.applicationIds.push(applicationId);
      this.documents.set(documentId, doc);
    }

    return true;
  }
}

// Create a singleton instance
export const documentStore = new DocumentStore();
