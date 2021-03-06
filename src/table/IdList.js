import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import styled from '@emotion/styled'
import {Editor, EditorState, ContentState, CompositeDecorator} from 'draft-js'
import 'draft-js/dist/Draft.css'
import {Cross} from '../lib/icons'
import {parseNumber} from '../lib/utils'
import {setSelected} from '../store/selected'
import {setFilter} from '../store/filters'

const Container = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	.DraftEditor-root {
		width: 100%;
		cursor: text;
	}
	:hover {
		border-color: #0074D9
	}
`;

const idRegex = /[^\s,]+/g; // /\d+\.\d+|\d+/g

function IdList({style, className, ids, isValid, isNumber, onChange, focusOnMount, close}) {
	const editorRef = React.useRef();
	const [editorState, setEditorState] = React.useState(initState);

	/*React.useEffect(() => {
		// Close the dropdown if the user scrolls
		// (we don't track position changes during scrolling)
		window.addEventListener('scroll', close, true);
		return () => window.removeEventListener('scroll', close);
	}, [close])*/

	React.useEffect(() => {
		if (!editorState.getSelection().hasFocus) {
			let state = EditorState.push(editorState, ContentState.createFromText(ids.join(', ')), 'remove-range')
			state = EditorState.moveSelectionToEnd(state)
			setEditorState(state)
		}
	}, [ids])

	function initState() {
		const decorator = new CompositeDecorator([
			{
				strategy: findInvalidIds,
				component: props => <span style={{color: "red"}}>{props.children}</span>,
			}
		]);
		let state = EditorState.createWithContent(ContentState.createFromText(ids.join(', ')), decorator)
		if (focusOnMount)
			state = EditorState.moveFocusToEnd(state)
		return state
	}

	function findInvalidIds(contentBlock, callback, contentState) {
		const text = contentBlock.getText();
		let matchArr, start;
		while ((matchArr = idRegex.exec(text)) !== null) {
			start = matchArr.index;
			const id = isNumber? parseNumber(matchArr[0]): matchArr[0];
			if (!isValid(id))
				callback(start, start + matchArr[0].length);
		}
	}

	function clear(e) {
		e.stopPropagation();	// don't take focus from editor

		//setEditorState(EditorState.push(editorState, ContentState.createFromText('')))
		/*let contentState = editorState.getCurrentContent();
		const firstBlock = contentState.getFirstBlock();
		const lastBlock = contentState.getLastBlock();
		const allSelected = new SelectionState({
			anchorKey: firstBlock.getKey(),
			anchorOffset: 0,
			focusKey: lastBlock.getKey(),
			focusOffset: lastBlock.getLength(),
			hasFocus: true
		});
		contentState = Modifier.removeRange(contentState, allSelected, 'backward');
		const state = EditorState.push(editorState, contentState, 'remove-range');
		setEditorState(state);*/
		onChange([]);
	}

	function emitChange(state) {
		const s = state.getCurrentContent().getPlainText();
		let updatedIds = s.match(idRegex) || [];
		if (isNumber)
			updatedIds = updatedIds.map(id => parseNumber(id));
		if (updatedIds.join() !== ids.join())
			onChange(updatedIds);
	}

	function handleKeyCommand(command) {
		if (command === 'enter') {
			// Perform a request to save your contents, set
			// a new `editorState`, etc.
			return 'handled';
		}
		return 'not-handled';
	}

	return (
		<Container
			style={style}
			className={className}
			onClick={e => editorRef.current.focus()}
		>
			<Editor
				ref={editorRef}
				editorState={editorState}
				onChange={setEditorState}
				handleReturn={() => (emitChange(editorState) || 'handled')}	// return 'handled' to prevent default handler
				onBlur={() => emitChange(editorState)}
				placeholder={'Enter list...'}
			/>
			{editorState.getCurrentContent().hasText() && <Cross onClick={clear} />}
		</Container>
	)
}

const IdFilter = connect(
	(state, ownProps) => {
		const {dataSet, dataKey} = ownProps;
		const {ids, filters} = state[dataSet];
		return {
			ids: filters[dataKey].values.map(v => v.value) || [],
			isValid: (id) => ids.includes(id),
			isNumber: ids.length && typeof ids[0] === 'number'
		}
	},
	(dispatch, ownProps) => {
		const {dataSet, dataKey} = ownProps;
		return {
			onChange: ids => dispatch(setFilter(dataSet, dataKey, ids))
		}
	}
)(IdList)

IdFilter.propTypes = {
	dataSet: PropTypes.string.isRequired,
	dataKey: PropTypes.string.isRequired
}

const IdSelector = connect(
	(state, ownProps) => {
		const {dataSet} = ownProps;
		const {ids, selected} = state[dataSet];
		return {
			ids: selected,
			isValid: (id) => ids.includes(id),
			isNumber: ids.length && typeof ids[0] === 'number'
		}
	},
	(dispatch, ownProps) => {
		const {dataSet} = ownProps;
		return {
			onChange: ids => dispatch(setSelected(dataSet, ids))
		}
	}
)(IdList)

IdSelector.propTypes = {
	dataSet: PropTypes.string.isRequired
}

export {IdFilter, IdSelector}