import Place, { IPlace, IEntityContainer } from "./place";

export default class Room extends Place implements IRoom {

}

export interface IRoom extends IPlace, IEntityContainer {

}