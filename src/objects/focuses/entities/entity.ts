import Focus, { IFocus } from "../focus";

export interface IEntity extends IFocus {

}

export default class Entity extends Focus implements IEntity {

}