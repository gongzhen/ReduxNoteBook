import React from 'react'
import ReactDOM from 'react-dom'

///////////////////////////////
///////  Components ///////////
///////////////////////////////

const NoteEditor = ({note, onChangeNote, onCloseNote}) => (
	<div>
		<div>
			<textarea 
			className = "editor-content" 
			autoFocus 
			value={note.content} 
			onChange = {event => onChangeNote(note.id, event.target.value)}
			/>
		</div>
		<button className="editor-button" onClick={onCloseNote}>
			Close
		</button>
	</div>
);

const NoteTitle = ({note}) => {
	const title = note.content.split('\n')[0].replace(/^\s+|\s+$/g, '');
	if(title === '') {
		return <i>Untitled</i>;
	}
	return <span>{title}></span>;
};

const NoteLink = ({note, onOpenNote}) => (
	<li className = "note-list-item">
		<a href='#' onClick = {() => onOpenNote(note.id)}>
			<NoteTitle note={note}/>
		</a>
	</li>
);

const NoteList = ({notes, onOpenNote}) => (
	<ul className = "note-list"> 
	{
		Object.keys(notes).map(id => 
			<NoteLink 
				key={id} 
				note={notes[id]} 
				onOpenNote={onOpenNote} 
			/>
		)
	}
	</ul>
);

const NoteApp = ({
	notes, openNoteId, onAddNote, onChangeNote, onOpenNote, onCloseNote
}) => (
	<div>
	{
		openNoteId ? 
		<NoteEditor
			note = {notes[openNoteId]} 
			onChangeNote = {onChangeNote} 
			onCloseNote={onCloseNote} 
		/> : 
		<div>
			<NoteList notes = {notes} onOpenNote = {onOpenNote} />
			{
				<button className = "editor-button" onClick={onAddNote} >New Note </button>					
			}
		</div>
	}
	</div>
);

class NoteAppContainer extends React.Component {
	constructor(props) {
		super();
		this.state = props.store.getState();
		this.onAddNote = this.onAddNote.bind(this);
		this.onChangeNote = this.onChangeNote.bind(this);
		this.onOpenNote = this.onOpenNote.bind(this);
		this.onCloseNote = this.onCloseNote.bind(this);
	}

	componentWillMount() {
		this.unsubscribe = this.props.store.subscribe(() => this.setState(this.props.store.getState()));		
	}

	componentWillUnmount() {	
		this.unsubscribe();
	}

	onAddNote() {
		this.props.store.dispatch({
			type:CREATE_NOTE
		});
	}

	onChangeNote(id, content) {
		this.props.store.dispatch({
			type:UPDATE_NOTE,
			id,
			content
		});
	}

	onOpenNote(id) {
		this.props.store.dispatch({
			type:OPEN_NOTE,
			id
		});
	}

	onCloseNote() {
		this.props.store.dispatch({
			type: CLOSE_NOTE
		});
	}

	render(){
		return(
			<NoteApp 
				{...this.state}
				onAddNote = {this.onAddNote}
				onChangeNote = {this.onChangeNote}
				onOpenNote = {this.onOpenNote}
				onCloseNote = {this.onCloseNote}
			/>
		);
	}
}

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
		getState: () => state,
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

const OPEN_NOTE = 'OPEN_NOTE';
const CLOSE_NOTE = 'CLOSE_NOTE';
const CREATE_NOTE = "CREATE_NOTE";
const UPDATE_NOTE = "UPDATE_NOTE";

/////////////////
// Our reducer //
/////////////////

const initialState = {
	nextNoteId: 1,
	notes:{},
	openNoteId: null
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
				openNoteId: id,
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
		case OPEN_NOTE: {
			return {
				...state,
				openNoteId: action.id
			};
		}
		case CLOSE_NOTE: {
			return {
				...state,
				openNoteId:null
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

ReactDOM.render(
	<NoteAppContainer store={store}/>,
	document.getElementById('root')
);




