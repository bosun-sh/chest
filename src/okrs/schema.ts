export type KeyResult = {
  id: string;
  description: string;
  target: string;
};

export type OKR = {
  id: string;
  objective: string;
  keyResults: KeyResult[];
  owner?: string;
  tags?: string[];
};
