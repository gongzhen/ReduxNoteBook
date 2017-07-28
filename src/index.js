import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

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

const createStore = (reducer, middleware) => {
	let state;
	const subscribers = [];
	const coreDispatch = action => {
		validateAction(action);
		state = reducer(state, action);
		subscribers.forEach(handler => handler());
	};
	const getState = () => state;
	const store = {
		dispatch:coreDispatch,
		getState,
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
	if(middleware) {
		const dispatch = action => store.dispatch(action);
		store.dispatch = middleware({
			dispatch,
			getState
		})(coreDispatch);
	}
	coreDispatch({type: '@@redux/INIT'});
	return store;
};

const delayMiddleWare = () => next => action => {
	setTimeout(() => {
		next(action);
	}, 1000);
};

const loggingMiddleware = ({getState}) => next => action => {
	console.info('before', getState());
	console.info('action', action);
	const result = next(action);
	console.info('after', getState());
	return result;
}

const applyMiddleware = (...middlewares) => store => {
	if(middlewares.length === 0) {
		return dispatch => dispatch;
	}
	if(middlewares.length === 1) {
		return middlewares[0];
	}
	const boundMiddlewares = middlewares.map(middleware => 
		middleware(store)
	);

	return boundMiddlewares.reduce((a, b) => 
		next => a(b(next))
	);
}

const thunkMiddleware = ({dispatch, getState}) => next => action => {
	if (typeof action === 'function') {
		return action({dispatch, getState});
	}
	return next(action);
};

//////////////////////
// Our action types //
//////////////////////

const CREATE_NOTE = "CREATE_NOTE";
const UPDATE_NOTE = "UPDATE_NOTE";
const OPEN_NOTE = 'OPEN_NOTE';
const CLOSE_NOTE = 'CLOSE_NOTE';

/////////////////////////////////////
// Mini React Redux implementation //
/////////////////////////////////////

class Provider extends React.Component {
	getChildContext() {
		return {
			store: this.props.store
		};
	}

	render() {
		return this.props.children;
	}
}

Provider.childContextTypes = {
	store: PropTypes.object
};

const connect = (
	mapStateToProps = () => ({}),
	mapDispatchToProps = () => ({})
	) => Component => {
	
	class Connected extends React.Component {
		
		onStoreOrPropsChange(props) {
			const {store} = this.context;
			const state = store.getState();
			const stateProps = mapStateToProps(state, props);
			const dispatchProps = mapDispatchToProps(store.dispatch, props);
			this.setState({
				...stateProps,
				...dispatchProps
			});
		}
		
		componentWillMount() {
			const {store} = this.context;
			this.onStoreOrPropsChange(this.props);
			this.unsubscribe = store.subscribe(() =>
				this.onStoreOrPropsChange(this.props)
			);
		}

		componentWillReceiveProps(nextProps) {
			this.onStoreOrPropsChange(nextProps);
		}

		componentWillUnmount() {
			this.unsubscribe();
		}

		render() {
			return <Component {...this.props} {...this.state}/>;
		}
	}

	Connected.contextTypes = {
		store: PropTypes.object
	};

	return Connected;
};

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
			onChange = {event => 
				onChangeNote(note.id, event.target.value)
			}
		/>
		</div>
		<button className="editor-button" onClick={ onCloseNote }>
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
				<button className = "editor-button" onClick={onAddNote}>New Note</button>					
			}
		</div>
	}
	</div>
);

const mapStateToProps = state => ({
	notes: state.notes,
	openNoteId: state.openNoteId
});

const mapDispatchToProps = dispatch => ({
	onAddNote: () => dispatch({
		type: CREATE_NOTE
	}),

	onChangeNote: (id, content) => dispatch({
		type: UPDATE_NOTE,
		id,
		content
	}),

	onOpenNote: id => dispatch({
		type: OPEN_NOTE,
		id
	}),

	onCloseNote: () => dispatch({
		type: CLOSE_NOTE
	})
});

const NoteAppContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(NoteApp);

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

// const store = createStore(reducer, delayMiddleWare);

// const store = createStore(reducer, applyMiddleware(
// 	delayMiddleWare, 
// 	loggingMiddleware
// ));

const store = createStore(reducer, applyMiddleware(
	thunkMiddleware,
	loggingMiddleware
));

///////////////////////////////////////////////
// Render our app whenever the store changes //
///////////////////////////////////////////////

ReactDOM.render(
	<Provider store={store}>
		<NoteAppContainer />
	</Provider>,
	document.getElementById('root')
);




