<a name="module_ECS"></a>

## ECS
Constructor for a new entity-component-system manager.

```js
var ECS = require('ent-comp')
var ecs = new ECS()
```


* [ECS](#module_ECS)
    * [.components](#module_ECS+components)
    * [.createEntity()](#module_ECS+createEntity)
    * [.deleteEntity()](#module_ECS+deleteEntity)
    * [.createComponent()](#module_ECS+createComponent)
    * [.deleteComponent()](#module_ECS+deleteComponent)
    * [.addComponent()](#module_ECS+addComponent)
    * [.hasComponent()](#module_ECS+hasComponent)
    * [.removeComponent()](#module_ECS+removeComponent)
    * [.getState()](#module_ECS+getState)
    * [.getStatesList()](#module_ECS+getStatesList)
    * [.getStateAccessor()](#module_ECS+getStateAccessor)
    * [.getComponentAccessor()](#module_ECS+getComponentAccessor)
    * [.tick()](#module_ECS+tick)
    * [.render()](#module_ECS+render)
    * [.removeMultiComponent()](#module_ECS+removeMultiComponent)

----

<a name="module_ECS+components"></a>

## ecs.components
Hash of component definitions. Also aliased to `comps`.

```js
var comp = { name: 'foo' }
ecs.createComponent(comp)
ecs.components['foo'] === comp  // true
ecs.comps['foo']                // same
```

----

<a name="module_ECS+createEntity"></a>

## ecs.createEntity()
Creates a new entity id (currently just an incrementing integer).

Optionally takes a list of component names to add to the entity (with default state data).

```js
var id1 = ecs.createEntity()
var id2 = ecs.createEntity([ 'some-component', 'other-component' ])
```

----

<a name="module_ECS+deleteEntity"></a>

## ecs.deleteEntity()
Deletes an entity, which in practice means removing all its components.

```js
ecs.deleteEntity(id)
```

----

<a name="module_ECS+createComponent"></a>

## ecs.createComponent()
Creates a new component from a definition object. 
The definition must have a `name`; all other properties are optional.

Returns the component name, to make it easy to grab when the component
is being `require`d from a module.

```js
var comp = {
	 name: 'some-unique-string',
	 state: {},
	 order: 99,
	 multi: false,
	 onAdd:        (id, state) => { },
	 onRemove:     (id, state) => { },
	 system:       (dt, states) => { },
	 renderSystem: (dt, states) => { },
}

var name = ecs.createComponent( comp )
// name == 'some-unique-string'
```

Note the `multi` flag - for components where this is true, a given 
entity can have multiple state objects for that component.
For multi-components, APIs that would normally return a state object 
(like `getState`) will instead return an array of them.

----

<a name="module_ECS+deleteComponent"></a>

## ecs.deleteComponent()
Deletes the component definition with the given name. 
First removes the component from all entities that have it.

**Note:** This API shouldn't be necessary in most real-world usage - 
you should set up all your components during init and then leave them be.
But it's useful if, say, you receive an ECS from another library and 
you need to replace its components.

```js
ecs.deleteComponent( 'some-component' )
```

----

<a name="module_ECS+addComponent"></a>

## ecs.addComponent()
Adds a component to an entity, optionally initializing the state object.

```js
ecs.createComponent({
	name: 'foo',
	state: { val: 1 }
})
ecs.addComponent(id1, 'foo')             // use default state
ecs.addComponent(id2, 'foo', { val:2 })  // pass in state data
```

----

<a name="module_ECS+hasComponent"></a>

## ecs.hasComponent()
Checks if an entity has a component.

```js
ecs.addComponent(id, 'foo')
ecs.hasComponent(id, 'foo')       // true
```

----

<a name="module_ECS+removeComponent"></a>

## ecs.removeComponent()
Removes a component from an entity, triggering the component's 
`onRemove` handler, and then deleting any state data.

```js
ecs.removeComponent(id, 'foo')
ecs.hasComponent(id, 'foo')     	 // false
```

----

<a name="module_ECS+getState"></a>

## ecs.getState()
Get the component state for a given entity.
It will automatically have an `__id` property for the entity id.

```js
ecs.createComponent({
	name: 'foo',
	state: { val: 0 }
})
ecs.addComponent(id, 'foo')
ecs.getState(id, 'foo').val       // 0
ecs.getState(id, 'foo').__id      // equals id
```

----

<a name="module_ECS+getStatesList"></a>

## ecs.getStatesList()
Get an array of state objects for every entity with the given component. 
Each one will have an `__id` property for the entity id it refers to.
Don't add or remove elements from the returned list!

```js
var arr = ecs.getStatesList('foo')
// returns something shaped like:
//   [
//     {__id:0, x:1},
//     {__id:7, x:2},
//   ]
```

----

<a name="module_ECS+getStateAccessor"></a>

## ecs.getStateAccessor()
Makes a `getState`-like accessor bound to a given component. 
The accessor is faster than `getState`, so you may want to create 
an accessor for any component you'll be accessing a lot.

```js
ecs.createComponent({
	name: 'size',
	state: { val: 0 }
})
var getEntitySize = ecs.getStateAccessor('size')
// ...
ecs.addComponent(id, 'size', { val:123 })
getEntitySize(id).val      // 123
```

----

<a name="module_ECS+getComponentAccessor"></a>

## ecs.getComponentAccessor()
Makes a `hasComponent`-like accessor function bound to a given component. 
The accessor is much faster than `hasComponent`.

```js
ecs.createComponent({
	name: 'foo',
})
var hasFoo = ecs.getComponentAccessor('foo')
// ...
ecs.addComponent(id, 'foo')
hasFoo(id) // true
```

----

<a name="module_ECS+tick"></a>

## ecs.tick()
Tells the ECS that a game tick has occurred, causing component 
`system` functions to get called.

The optional parameter simply gets passed to the system functions. 
It's meant to be a timestep, but can be used (or not used) as you like.    

If components have an `order` property, they'll get called in that order
(lowest to highest). Component order defaults to `99`.
```js
ecs.createComponent({
	name: foo,
	order: 1,
	system: function(dt, states) {
		// states is the same array you'd get from #getStatesList()
		states.forEach(state => {
			console.log('Entity ID: ', state.__id)
		})
	}
})
ecs.tick(30) // triggers log statements
```

----

<a name="module_ECS+render"></a>

## ecs.render()
Functions exactly like `tick`, but calls `renderSystem` functions.
this effectively gives you a second set of systems that are 
called with separate timing, in case you want to 
[tick and render in separate loops](http://gafferongames.com/game-physics/fix-your-timestep/)
(which you should!).

```js
ecs.createComponent({
	name: foo,
	order: 5,
	renderSystem: function(dt, states) {
		// states is the same array you'd get from #getStatesList()
	}
})
ecs.render(1000/60)
```

----

<a name="module_ECS+removeMultiComponent"></a>

## ecs.removeMultiComponent()
Removes one particular instance of a multi-component.
To avoid breaking loops, the relevant state object will get nulled
immediately, and spliced from the states array later when safe 
(after the current tick/render/animationFrame).

```js
// where component 'foo' is a multi-component
ecs.getState(id, 'foo')   // [ state1, state2, state3 ]
ecs.removeMultiComponent(id, 'foo', 1)
ecs.getState(id, 'foo')   // [ state1, null, state3 ]
// one JS event loop later...
ecs.getState(id, 'foo')   // [ state1, state3 ]
```

----

