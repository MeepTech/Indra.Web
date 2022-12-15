import IUnique from "../unique";

export interface IFocus extends IUnique {
}

export default class Focus implements IFocus {
  readonly isUnique: true = true;
  id!: string;
  key!: string;
  keys!: Set<string>;
}