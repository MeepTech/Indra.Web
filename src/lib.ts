// globals
export * from './utilities/object';
export * from './utilities/validators'
import './utilities/array';
import './utilities/set';

// types
import Focus, { IFocus } from '../src/objects/focuses/focus';
import Entity, { IEntity } from '../src/objects/focuses/entities/entity';
import Place, { IPlace, IEntityContainer } from '../src/objects/focuses/places/place';
import Room, { IRoom } from '../src/objects/focuses/places/room';
import { IAction } from '../src/objects/commands/action';
import { IComponent } from '../src/objects/components/component';
import Dex, { TDex, HashKey} from '../src/utilities/dex';
import IUnique from './objects/unique';

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