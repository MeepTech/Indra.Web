import Focus, { IFocus } from "../focus";

export interface IPlace extends IFocus {

}

export interface IEntityContainer extends IFocus, IPlace {

}

export default abstract class Place extends Focus implements IPlace {

}

