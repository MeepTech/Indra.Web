export default interface IUnique {
  id: string;
  key: string;
  keys: Set<string>;
  isUnique: true;
}
