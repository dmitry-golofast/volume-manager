export const existingNames: string[];

export const mockApi: {
  checkName(name: string): Promise<{ unique: boolean }>;
};
