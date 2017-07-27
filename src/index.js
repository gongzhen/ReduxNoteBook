import React from 'react'
import ReactDOM from 'react-dom'

///////////////////////////////
// Mini Redux implementation //
///////////////////////////////

const validateAction = action =>  {
	if(!action || typeof action !== 'object' || Array.isArray(action)){
		throw new Error('Action must be an object');
	}
	if(typeof action.type == 'undefined') {
		throw new Error('Action must have a type!');
	}
};

const createStore = reducer => {
	let state;
	const subscribers = [];
	const store = {
		///dispatch({type:CREATE_NOTE})
		dispatch: action => {
			validateAction(action);
			state = reducer(state, action);
			subscribers.forEach(handler => handler());
		},
		getState:() => state,
		subscribe:handler => {
			subscribers.push(handler);
			return () => {
				const index = subscribers.indexOf(handler);
				if(index > 0) {
					subscribers.splice(index, 1);
				}
			};
		}
	};
	store.dispatch({type: '@@redux/INIT'});
	return store;
};

//////////////////////
// Our action types //
//////////////////////

const CREATE_NOTE = "CREATE_NOTE";
const UPDATE_NOTE = "UPDATE_NOTE";

/////////////////
// Our reducer //
/////////////////

const initialState = {
	nextNoteId: 1,
	notes:{}
};

const reducer = (state = initialState, action) => {
	switch(action.type) {
		case CREATE_NOTE: {
			const id = state.nextNoteId;
			const newNote = {
				id,
				content:''
			};
			return {
				...state,
				nextNoteId: id + 1,
				notes:{
					...state.notes,
					[id]: newNote
				}
			};
		}
		case UPDATE_NOTE: {
			const {id, content} = action;
			const editedNote = {
				...state.notes[id],
				content
			};
			return {
				...state,
				notes:{
					...state.notes,
					[id]:editedNote					
				}
			};
		}
		default:
			return state;
	}
};

/////////////////
// Our store //
/////////////////

const store = createStore(reducer);

///////////////////////////////////////////////
// Render our app whenever the store changes //
///////////////////////////////////////////////

store.subscribe(() => {
	ReactDOM.render(
	<pre>{JSON.stringify(store.getState(), null, 2)}</pre>,
	document.getElementById('root')
	);
});

//////////////////////
// Dispatch actions //
//////////////////////

store.dispatch({type:CREATE_NOTE});

store.getState();

store.dispatch({type:UPDATE_NOTE});



