export type ChestLayer = {
  workspaceRoot: string;
};

export const makeChestLayer = (workspaceRoot: string): ChestLayer => ({
  workspaceRoot,
});
