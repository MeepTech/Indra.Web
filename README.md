# **Indra.Web**
The Base JS/TS library for the game: Indra's Web.

## **Installation**
### **With npm**
```
TODO: Add the NPM Command when this package becomes available.
```
### **Build from Source**
1) Clone this repository to your local filesystem.
2) Run `npm i` in this directory to install node dependencies
3) Run `npm run lib` to build the library. (You can alternitively run using `dev` instead of `lib` to get access to development mode with code watching).
4) The project should be built and output to the `build/prod` folder as `lib.js` with the TS typings output to `build/prod/types`. (If you ran in development mode in step 3, the outputs will be in the `build/dev` folder instead.)
5) Copy the nessisary files into your project, and target `lib.js` as the module for imports.

## **Object Types**
### **Actions and Commands**
Actions are units of logic attached to Focuses that can be executed by an Actor via a Command object.
- [IAction](./docs/Objects/Commands/IAction.md): The base interface for all actions
- [Action](./docs/Objects/Commands/Action.md): The base abstract class for all actions
- [Command](./docs/Objects/Commands/Command.md): The data class for a command's information.
### **Actors**
Anything that can execute a command or action as the instigator.
- [IActor](./docs/Objects/Actors/IActor.md): The base interface for all actors
### **Focuses/Foci**
Anything that can be targeted directly. Focuses are the targets of actions, and can often execute actions themselves as well.
- [Focus](./docs/Objects/Focuses/Focus.md): The base abstract class for all focuses
- [IFocus](./docs/Objects/Focuses/IFocus.md): The base interface for all focuses
#### **Entities**
Anything that can be placed within an IEntityContainer Type place. These are npcs, items, and other interactables that are not locations themselves.
- [Entity](./docs/Objects/Focuses/Entities/Entity.md): The base abstract class for all entities
- [IEntity](./docs/Objects/Focuses/Entities/Entity.md): The base interface for all entities
#### **Places**
Spacial representations of locations, and containers for entities and other places.
- [Place](./docs/Objects/Focuses/places/Place.md): The base abstract class for all places
- [IPlace](./docs/Objects/Focuses/places/IPlace.md): The base interface for all places
- [Room](./docs/Objects/Focuses/places/Room.md)
- [IEntityContainer](<./docs/objects/Focuses/Places/IEntityContainer.md>)
### **Components**
Components are units of serializeable data and additional action logic that can be attached to a Focus. The Focus inherits all of the actions of their components, as components cannot be targedted/focused directly.
- [IComponent](./docs/Objects/Components/IComponent.md): The base interface for all components of all types.
### **Utility**
#### **Dex**
A tag based collection of values.
- [Dex](./docs/Objects/Dex.md): The Class
- [TDex](./docs/Objects/TDex.md): The TS Typing
- [HashKey](./docs/Objects/HashKey.md): Unique keys used by the Dex 
#### **Interfaces and Traits**
Interfaces that can be shared between different kinds of objects to indicate information about them or functionality.
- [IUnique](./docs/Objects/IUnique/md): Indicates an item has unique keys to identify it by under a parent, as well as a built in uuid.
## **Utility Functions**
- [Array Helper Functions](<./docs/Utilities/Array.md>)
- [Set Helper Functions](<./docs/Utilities/Set.md>)
- [Object Helper Functions](<./docs/Utilities/Object.md>)
- [Validation Functions](<./docs/Utilities/Validators.md>)


## Contact Info
> meepdottech@gmail.com

### Licence
> [MIT](./LICENCE.md)