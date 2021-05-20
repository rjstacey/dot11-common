import PropTypes from 'prop-types'
import React from 'react'
import styled from '@emotion/styled'
import useClickOutside from '../lib/useClickOutside'
import {ActionButton} from '../lib/icons'

const Wrapper = styled.div`
	display: inline-block;
	user-select: none;
`;

const DropdownContainer = styled.div`
	position: absolute;
	top: 3px;
	right: 0;
	padding: 10px;
	display: flex;
	flex-direction: column;
	background: #fff;
	border: 1px solid #ccc;
	border-radius: 5px;
	box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
	z-index: 9;
	overflow: auto;
	box-sizing: border-box;
	:focus {outline: none}
`;

function ActionButtonDropdown({
	style,
	className,
	name,
	label,
	title,
	disabled,
	children
}) {
	const [isOpen, setOpen] = React.useState(false);
	const wrapperRef = React.useRef();
	const dropdownRef = React.useRef();

	const [dropdownStyle, setDropdownStyle] = React.useState({});

	React.useEffect(() => {
		// After mount; adjust if off screen to the left
		if (dropdownRef.current) {
			const bounds = dropdownRef.current.getBoundingClientRect();
			const maxHeight = window.innerHeight - bounds.y;
			const maxWidth = window.innerWidth;
			const right = bounds.left < 0? bounds.left: 0;
			setDropdownStyle({maxHeight, maxWidth, right});
		}
	}, [isOpen]);

	const close = () => setOpen(false);

	const childrenWithClose = React.Children.map(children,
		child => React.isValidElement(child)? React.cloneElement(child, {close}): child
	);

	useClickOutside(wrapperRef, close);

	return (
		<Wrapper
			className={className}
			style={style}
			ref={wrapperRef}
		>
			<ActionButton
				name={name}
				label={label}
				title={title}
				disabled={disabled}
				onClick={() => setOpen(!isOpen)}
			/>
			<div style={{position: 'relative'}}>
				{isOpen &&
					<DropdownContainer
						ref={dropdownRef}
						style={dropdownStyle}
					>
						{childrenWithClose}
					</DropdownContainer>}
			</div>
		</Wrapper>
	)
}

ActionButtonDropdown.propTypes = {
	name: PropTypes.string,
	label: PropTypes.string,
	title: PropTypes.string,
	disabled: PropTypes.bool,
}

export {ActionButtonDropdown};
