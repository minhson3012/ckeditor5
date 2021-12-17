/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module list/listreversedcommand
 */

import { Command } from 'ckeditor5/src/core';
import { getSelectedListItems } from './utils';

/**
 * The list reversed command. It changes `listReversed` attribute of the selected list items.
 * It is used by the {@link module:list/liststyle~ListStyle list style feature}.
 *
 * @extends module:core/command~Command
 */
export default class ListReversedCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const value = this._getValue();
		this.value = value;
		this.isEnabled = value != null;
	}

	/**
	 * Executes the command.
	 *
	 * @param {Object} options
	 * @param {Boolean} [options.reversed=false] Whether the list should be reversed.
	 * @protected
	 */
	execute( options = {} ) {
		const model = this.editor.model;
		const listItems = getSelectedListItems( model )
			.filter( item => item.getAttribute( 'listType' ) == 'numbered' );

		model.change( writer => {
			for ( const item of listItems ) {
				writer.setAttribute( 'listReversed', !!options.reversed, item );
			}
		} );
	}

	/**
	 * Checks the command's {@link #value}.
	 *
	 * @private
	 * @returns {Boolean|null} The current value.
	 */
	_getValue() {
		const listItem = this.editor.model.document.selection.getFirstPosition().parent;

		if ( listItem && listItem.is( 'element', 'listItem' ) && listItem.getAttribute( 'listType' ) == 'numbered' ) {
			return listItem.getAttribute( 'listReversed' );
		}

		return null;
	}
}
