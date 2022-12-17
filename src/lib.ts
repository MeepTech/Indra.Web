// globals
export * from './utilities/object';
export * from './utilities/validators'
import './utilities/array';
import './utilities/set';

// types
import Dex, { TDex, HashKey} from './objects/dex';
import IUnique from './objects/unique';
import Focus, { IFocus } from './objects/focuses/focus';
import Entity, { IEntity } from './objects/focuses/entities/entity';
import Place, { IPlace, IEntityContainer } from './objects/focuses/places/place';
import Room, { IRoom } from './objects/focuses/places/room';
import { IAction } from './objects/commands/action';
import { IComponent } from './objects/components/component';

export {
  // unique.ts
  IUnique,

  // focus.ts
  Focus,
  IFocus,

  // entity.ts
  Entity,
  IEntity,

  // place.ts
  Place,
  IPlace,
  IEntityContainer,

  // room.ts
  Room,
  IRoom,

  // action.ts
  IAction,

  // component.ts
  IComponent,

  // dex.ts
  Dex,
  TDex,
  HashKey
}