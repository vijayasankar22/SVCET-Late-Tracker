export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const { operation, path } = context;
    const message = `Firestore Permission Denied: Client does not have permission to ${operation} on document at path ${path}.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is for environments like Node.js
    if (typeof Object.setPrototypeOf === 'function') {
      Object.setPrototypeOf(this, new.target.prototype);
    } else {
      (this as any).__proto__ = new.target.prototype;
    }
  }
}
