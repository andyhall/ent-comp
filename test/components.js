'use strict'

var ECS = require('..')
var tape = require('tape')


tape('Creating and deleting components', function(t) {
	var comp = { name: 'foo' }
	var ecs = new ECS()

	t.throws(function() { ecs.createComponent() })
	t.throws(function() { ecs.createComponent({}) })
	t.throws(function() { ecs.deleteComponent() })
	t.throws(function() { ecs.deleteComponent('foo') })
	t.throws(function() { ecs.createComponent({ name: null }) }, 'Bad component names')
	t.throws(function() { ecs.createComponent({ name: '' }) })
	t.throws(function() { ecs.createComponent({ name: 5 }) })
	t.throws(function() { ecs.createComponent({ name: true }) })
	t.throws(function() { ecs.createComponent({ name: {} }) })

	t.doesNotThrow(function() {
		ecs.createComponent(comp)
	}, 'createComponent')

	t.ok(ecs.components[comp.name], 'component exists')
	t.ok(ecs.comps[comp.name], 'comps alias works')
	t.equals(comp, ecs.components[comp.name])
	t.equals(comp, ecs.comps[comp.name])

	t.throws(function() {
		ecs.deleteComponent(comp)
	}, 'cannot delete by object')

	t.doesNotThrow(function() {
		ecs.deleteComponent(comp.name)
	}, 'deleteComponent by name')

	t.notOk(ecs.comps[comp.name], 'component deleted')

	t.end()
})



tape('Adding and removing components', function(t) {
	var comp = { name: 'foo' }
	var ecs = new ECS()
	ecs.createComponent(comp)

	t.throws(function() { ecs.addComponent() })
	t.throws(function() { ecs.addComponent(37) })
	t.throws(function() { ecs.addComponent(37, 'bar') })

	var id = ecs.createEntity()
	t.doesNotThrow(function() { ecs.addComponent(id, comp.name) }, 'add component')
	t.throws(function() { ecs.addComponent(id, comp.name) }, 'add component twice')

	t.throws(function() { ecs.hasComponent(id) })
	t.throws(function() { ecs.hasComponent(id, 'bar') })
	t.ok(ecs.hasComponent(id, comp.name), 'entity has component')

	t.throws(function() { ecs.removeComponent() })
	t.throws(function() { ecs.removeComponent(id) })
	t.throws(function() { ecs.removeComponent(id, 'bar') })

	var id2 = ecs.createEntity()
	t.doesNotThrow(function() { ecs.addComponent(id2, comp.name, { foo: 1 }) }, 'add component with state')
	t.ok(ecs.hasComponent(id2, comp.name))

	t.doesNotThrow(function() { ecs.removeComponent(id, comp.name) }, 'remove component')
	t.throws(function() { ecs.removeComponent(id, comp.name) }, 'remove component twice')
	t.false(ecs.hasComponent(id, comp.name), 'entity no longer has component')

	var id3
	t.doesNotThrow(function() { id3 = ecs.createEntity([comp.name]) })
	t.ok(ecs.hasComponent(id3, comp.name), 'component added at entity creation')

	t.doesNotThrow(function() { ecs.deleteEntity(id3, true) })
	t.false(ecs.hasComponent(id3, comp.name), 'component removed when entity deleted')

	t.end()
})



tape('Nontrivial add/remove sequence', function(t) {
	var comp = {
		name: 'foo',
		state: { num: -1 }
	}
	var ecs = new ECS()
	ecs.createComponent(comp)
	var ids = []
	for (var i = 0; i < 5; i++) ids.push(ecs.createEntity())
	function getState() {
		var s = ''
		for (var i = 0; i < 5; i++) {
			if (ecs.hasComponent(ids[i], comp.name)){
				s += ecs.getState(ids[i], comp.name).num
			} else {
				s += '-'
			}
		}
		return s
	}
	
	t.equals('-----', getState())
	ecs.addComponent(ids[1], comp.name, {num:1})
	ecs.addComponent(ids[2], comp.name, {num:2})
	ecs.addComponent(ids[3], comp.name, {num:3})
	t.equals('-123-', getState())
	ecs.removeComponent(ids[3], comp.name)
	ecs.addComponent(ids[4], comp.name, {num:4})
	ecs.removeComponent(ids[1], comp.name)
	ecs.addComponent(ids[0], comp.name, {num:0})
	t.equals('0-2-4', getState())
	ecs.addComponent(ids[3], comp.name, {num:3})
	ecs.removeComponent(ids[4], comp.name)
	ecs.addComponent(ids[1], comp.name, {num:1})
	ecs.removeComponent(ids[0], comp.name)
	t.equals('-123-', getState())

	t.end()
})



tape('Component state data', function(t) {
	var comp = {
		name: 'foo',
		state: {
			num: 1,
			str: 'hoge',
			arr: [1, 2, 3],
			fcn: function() { },
			obj: {
				num: 2
			},
		}
	}
	var ecs = new ECS()
	ecs.createComponent(comp)
	var id = ecs.createEntity()
	ecs.addComponent(id, comp.name)

	t.throws(function() { ecs.getState() })
	t.throws(function() { ecs.getState(id + 37) })
	var state
	t.doesNotThrow(function() { state = ecs.getState(id + 37, comp.name) }, 'getState is okay with bad entity')
	t.equals(state, undefined, 'getState with bad entity is undefined')


	t.doesNotThrow(function() { state = ecs.getState(id, comp.name) }, 'getState')
	t.ok(state, 'state returned')
	t.equals(state.num, comp.state.num, 'state property num')
	t.equals(state.str, comp.state.str, 'state property str')
	t.equals(state.arr, comp.state.arr, 'state property arr')
	t.equals(state.fcn, comp.state.fcn, 'state property fcn')
	t.equals(state.obj.num, comp.state.obj.num, 'state deep property')
	t.equals(state.__id, id, '__id property inserted')
	state.num = 37
	t.equals(ecs.getState(id, comp.name).num, 37, 'state is remembered')
	t.equals(comp.state.num, 1, 'definition state not overwritten')

	ecs.removeComponent(id, comp.name)
	t.equals(ecs.getState(id, comp.name), undefined, 'getState undefined after removing component')

	// passing in initial state
	var id2 = ecs.createEntity()
	ecs.addComponent(id2, comp.name, {
		num: 4,
		newnum: 5,
		obj: {
			num: 6
		}
	})
	var state2 = ecs.getState(id2, comp.name)
	t.equals(state2.num, 4, 'overwritten property')
	t.equals(state2.newnum, 5, 'overwritten new property')
	t.equals(state2.obj.num, 6, 'overwritten deep property')

	t.end()
})



tape('Component states list', function(t) {
	var ecs = new ECS()
	t.throws(function() { ecs.getStatesList() }, 'bad getStatesList')
	t.throws(function() { ecs.getStatesList('foo') }, 'bad getStatesList')

	var comp = {
		name: 'foo',
		state: { num: 23 }
	}
	ecs.createComponent(comp)
	var arr
	t.doesNotThrow(function() { arr = ecs.getStatesList(comp.name) }, 'getStatesList without entities')
	t.ok(arr, 'getStatesList result')
	t.equals(arr.length, 0, 'getStatesList zero entities')

	var id = ecs.createEntity()
	ecs.addComponent(id, comp.name)
	t.doesNotThrow(function() { arr = ecs.getStatesList(comp.name) }, 'getStatesList with entities')
	t.ok(arr, 'getStatesList result')
	t.equals(arr.length, 1, 'getStatesList entities')
	t.equals(arr[0].num, 23, 'getStatesList state data')

	t.end()
})


tape('Component state accessor', function(t) {
	var ecs = new ECS()
	t.throws(function() { ecs.getStateAccessor() }, 'bad accessor name')
	t.throws(function() { ecs.getStateAccessor('foo') }, 'bad accessor name')

	var comp = {
		name: 'foo',
		state: { num: 23 }
	}
	ecs.createComponent(comp)
	var accessor
	t.doesNotThrow(function() { accessor = ecs.getStateAccessor(comp.name) }, 'create accessor')
	var state
	t.doesNotThrow(function() { state = accessor() }, 'accessor with bad entity')
	t.equals(state, undefined, 'bad entity returns undefined state')
	t.doesNotThrow(function() { state = accessor(123) }, 'accessor with bad entity')
	t.equals(state, undefined, 'bad entity returns undefined state')

	var id = ecs.createEntity()
	ecs.addComponent(id, comp.name)
	t.doesNotThrow(function() { state = accessor(id) }, 'accessor with correct entity')
	t.ok(state, 'state object from accessor')
	t.equals(state.num, 23, 'state property from accessor')

	t.end()
})


