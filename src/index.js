import React from 'react'
import ReactDOM from 'react-dom'

const initialState = {
	nextNoteId: 1,
	notes:{}
};

window.state = initialState;

const CREATE_NOTE = "CREATE_NOTE";
const UPDATE_NOTE = "UPDATE_NOTE";



const reducer = (state = initialState, action) => {
	switch(action.type) {
		case CREATE_NOTE: {
			const id = state.nextNoteId;
			const newNote = {
				id,
				content:""
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


const handlers = {
	[CREATE_NOTE]:(state, action) => {
		return;
	},
	[UPDATE_NOTE]:(state, action) => {
		return;
	}
};

const state0 = reducer(undefined, {
	type: CREATE_NOTE
});

const state1 = reducer(state0, {
	type:UPDATE_NOTE,
	id:1,
	content:'Hello World'
});

ReactDOM.render(
	<pre>{JSON.stringify(state0, null, 2)}{JSON.stringify(state1, null, 2)}</pre>,
	document.getElementById('root')
);
