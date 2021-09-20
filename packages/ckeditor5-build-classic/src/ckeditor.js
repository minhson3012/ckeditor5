/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import FontSize from '@ckeditor/ckeditor5-font/src/fontsize';
import FontFamily from '@ckeditor/ckeditor5-font/src/fontfamily';
import FontColor from '@ckeditor/ckeditor5-font/src/fontcolor';
import FontBackgroundColor from '@ckeditor/ckeditor5-font/src/fontbackgroundcolor';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import CKFinder from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import Indent from '@ckeditor/ckeditor5-indent/src/indent';
import IndentBlock from '@ckeditor/ckeditor5-indent/src/indentblock';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import ListStyle from '@ckeditor/ckeditor5-list/src/liststyle';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import TableProperties from '@ckeditor/ckeditor5-table/src/tableproperties';
import TableCellProperties from '@ckeditor/ckeditor5-table/src/tablecellproperties';
import TextTransformation from '@ckeditor/ckeditor5-typing/src/texttransformation';
import CloudServices from '@ckeditor/ckeditor5-cloud-services/src/cloudservices';
import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import GeneralHtmlSupport from '@ckeditor/ckeditor5-html-support/src/generalhtmlsupport';
import SourceEditing from '@ckeditor/ckeditor5-source-editing/src/sourceediting';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import {
	toWidget,
	viewToModelPositionOutsideModelElement,
} from '@ckeditor/ckeditor5-widget/src/utils';

//
// The draggable-card editor plugin.
//

class HCardEditing extends Plugin {
	static get requires() {
		return [Widget];
	}

	init() {
		this._defineSchema();
		this._defineConverters();
		this._defineClipboardInputOutput();

		// View-to-model position mapping is needed because an draggable-card element in the model is represented by a single element,
		// but in the view it is a more complex structure.
		this.editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement(
				this.editor.model,
				(viewElement) => viewElement.hasClass('draggable-card')
			)
		);
	}

	_defineSchema() {
		this.editor.model.schema.register('draggable-card', {
			allowWhere: '$text',
			isInline: true,
			isObject: true,
			allowAttributes: ['text', 'src', 'type'],
			// allowAttributes: [ 'email', 'name', 'tel' ]
		});
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		// Data-to-model conversion.
		conversion.for('upcast').elementToElement({
			view: {
				name: 'div',
				classes: ['draggable-card'],
			},
			model: (viewElement, { writer }) => {
				return writer.createElement(
					'draggable-card',
					getCardDataFromViewElement(viewElement)
				);
			},
		});

		// Model-to-data conversion.
		conversion.for('dataDowncast').elementToElement({
			model: 'draggable-card',
			view: (modelItem, { writer: viewWriter }) =>
				createCardView(modelItem, viewWriter),
		});

		// Model-to-view conversion.
		conversion.for('editingDowncast').elementToElement({
			model: 'draggable-card',
			view: (modelItem, { writer: viewWriter }) =>
				toWidget(createCardView(modelItem, viewWriter), viewWriter),
		});

		// Helper method for both downcast converters.
		function createCardView(modelItem, viewWriter) {
			// const email = modelItem.getAttribute( 'email' );
			// const name = modelItem.getAttribute( 'name' );
			// const tel = modelItem.getAttribute( 'tel' );
			const text = modelItem.getAttribute('text');
			const src = modelItem.getAttribute('src');
			const type = modelItem.getAttribute('type');
			let cardView;
			if (type === 1) {
				cardView = viewWriter.createContainerElement('div', {
					class: 'draggable-card card-header collapse-level-0 d-inline-block',
				});

				const linkView = viewWriter.createContainerElement('div', {
					class: 'w-100 text-truncate pl-1',
				});

				const iconView = viewWriter.createContainerElement('img', {
					src: src,
				});

				const textView = viewWriter.createContainerElement('span', {
					class: 'card-text',
				});

				viewWriter.insert(
					viewWriter.createPositionAt(textView, 0),
					viewWriter.createText(text)
				);

				viewWriter.insert(
					viewWriter.createPositionAt(linkView, 0),
					iconView
				);
				viewWriter.insert(
					viewWriter.createPositionAt(linkView, 'end'),
					textView
				);

				viewWriter.insert(
					viewWriter.createPositionAt(cardView, 0),
					linkView
				);
				viewWriter.insert(
					viewWriter.createPositionAt(cardView, 'end'),
					linkView
				);
			} else {
				cardView = viewWriter.createContainerElement('div', {
					class:
						type === 2
							? 'draggable-card display-draggable d-inline-block py-0'
							: 'draggable-card tag-draggable tag-drag-display d-inline-block py-0',
				});

				const iconView = viewWriter.createContainerElement('img', {
					src: src,
				});

				const textView = viewWriter.createContainerElement('span', {
					class: 'card-text',
				});

				viewWriter.insert(
					viewWriter.createPositionAt(textView, 0),
					viewWriter.createText(text)
				);
				viewWriter.insert(
					viewWriter.createPositionAt(cardView, 0),
					iconView
				);
				viewWriter.insert(
					viewWriter.createPositionAt(cardView, 'end'),
					textView
				);
			}

			return cardView;
		}
	}

	// Integration with the clipboard pipeline.
	_defineClipboardInputOutput() {
		const view = this.editor.editing.view;
		const viewDocument = view.document;

		// Processing pasted or dropped content.
		this.listenTo(viewDocument, 'clipboardInput', (evt, data) => {
			// The clipboard content was already processed by the listener on the higher priority
			// (for example while pasting into the code block).
			if (data.content) {
				return;
			}

			const textData = data.dataTransfer.getData('textValue');

			if (!textData) {
				return;
			}

			// Use JSON data encoded in the DataTransfer.
			const jsonData = JSON.parse(textData);

			// Translate the draggable-card data to a view fragment.
			const writer = new UpcastWriter(viewDocument);
			const fragment = writer.createDocumentFragment();

			switch (jsonData.type) {
				case 1:
					generateGroupElement(writer, fragment, jsonData);
					break;
				case 2:
					genenerateSmallGroupElement(writer, fragment, jsonData);
					break;
				case 3:
					genenerateTagElement(writer, fragment, jsonData);
					break;
				default:
					break;
			}

			// Provide the content to the clipboard pipeline for further processing.
			data.content = fragment;
		});

		// Processing copied, pasted or dragged content.
		this.listenTo(document, 'clipboardOutput', (evt, data) => {
			if (data.content.childCount != 1) {
				return;
			}

			const viewElement = data.content.getChild(0);

			if (
				viewElement.is('element', 'div') &&
				viewElement.hasClass('draggable-card')
			) {
				data.dataTransfer.setData(
					'textValue',
					JSON.stringify(getCardDataFromViewElement(viewElement))
				);
			}
		});
	}
}

//
// draggable-card helper functions.
//

function generateGroupElement(writer, fragment, data) {
	writer.appendChild(
		writer.createElement(
			'div',
			{
				class: 'draggable-card card-header collapse-level-0 d-inline-block',
			},
			[
				// writer.createElement( 'a', { href: `mailto:${ contact.email }`, class: 'p-name u-email' }, contact.name ),
				// writer.createElement( 'span', { class: 'p-tel' }, contact.tel )
				writer.createElement(
					'div',
					{ class: 'w-100 text-truncate pl-1' },
					[
						writer.createElement('img', { src: data.src }),
						writer.createElement(
							'span',
							{ class: 'card-text type-1' },
							data.text
						),
					]
				),
			]
		),
		fragment
	);
}

function genenerateSmallGroupElement(writer, fragment, data) {
	writer.appendChild(
		writer.createElement(
			'div',
			{
				class: 'draggable-card display-draggable d-inline-block py-0',
			},
			[
				writer.createElement('img', { src: data.src }),
				writer.createElement(
					'span',
					{ class: 'card-text type-2 uchi-blue' },
					data.text
				),
			]
		),
		fragment
	);
}

function genenerateTagElement(writer, fragment, data) {
	writer.appendChild(
		writer.createElement(
			'div',
			{
				class: 'draggable-card tag-draggable tag-drag-display d-inline-block py-0',
			},
			[
				writer.createElement('img', { src: data.src }),
				writer.createElement(
					'span',
					{ class: 'card-text type-3' },
					data.text
				),
			]
		),
		fragment
	);
}

function getCardDataFromViewElement(viewElement) {
	const children = Array.from(viewElement.getChildren());
	const textChildren = Array.from(children[0].getChildren());
	let textElement;
	let imgElement;
	let type;
	if (textChildren.length) {
		textElement = textChildren.find(
			(element) =>
				element.is('element', 'span') && element.hasClass('card-text')
		);
		imgElement = textChildren.find((element) =>
			element.is('element', 'img')
		);
		type = 1;
	} else {
		textElement = children.find(
			(element) =>
				element.is('element', 'span') && element.hasClass('card-text')
		);
		imgElement = children.find((element) => element.is('element', 'img'));
		if (textElement.hasClass('type-2')) {
			type = 2;
		} else if (textElement.hasClass('type-3')) {
			type = 3;
		}
	}
	return {
		text: getText(textElement),
		src: imgElement.getAttribute('src'),
		type,
	};
}

function getText(viewElement) {
	return Array.from(viewElement.getChildren())
		.map((node) => (node.is('$text') ? node.data : ''))
		.join('');
}

// The editor creator to use.

export default class ClassicEditor extends ClassicEditorBase {}

// Plugins to include in the build.
ClassicEditor.builtinPlugins = [
	Essentials,
	Alignment,
	FontSize,
	FontFamily,
	FontColor,
	FontBackgroundColor,
	UploadAdapter,
	Autoformat,
	Bold,
	Italic,
	Strikethrough,
	Underline,
	BlockQuote,
	CKFinder,
	CloudServices,
	EasyImage,
	Heading,
	Image,
	ImageCaption,
	ImageResize,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	Indent,
	IndentBlock,
	Link,
	List,
	ListStyle,
	MediaEmbed,
	Paragraph,
	PasteFromOffice,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,
	TextTransformation,
	Mention,
	GeneralHtmlSupport,
	SourceEditing,
	HCardEditing,
];

// Editor configuration.
ClassicEditor.defaultConfig = {
	toolbar: {
		shouldNotGroupWhenFull: true,
		items: [
			'heading',
			'|',
			'fontfamily',
			'fontsize',
			'fontColor',
			'fontBackgroundColor',
			'|',
			'bold',
			'italic',
			'underline',
			'strikethrough',
			'|',
			'alignment',
			'|',
			'numberedList',
			'bulletedList',
			'|',
			'outdent',
			'indent',
			'|',
			'link',
			'blockquote',
			'uploadImage',
			'insertTable',
			'mediaEmbed',
			'|',
			'undo',
			'redo',
			'sourceEditing',
		],
	},
	htmlSupport: {
		// allow: [{ name: /.*/, attributes: !0, styles: !0, classes: !0 }],
		allow: [
			{
				name: /^(div|section|article|table|td|figure)$/,
				attributes: true,
				classes: true,
				styles: true,
			},
			{
				name: /^(span|blockquote)$/,
				styles: true,
			},
			{
				name: 'font',
				attributes: true,
			},
			{
				name: 'p',
				classes: true,
				styles: true,
			},
		],
		disallow: [
			{
				attributes: [
					{ key: /^on(.*)/i, value: !0 },
					{
						key: /.*/,
						value: /(\b)(on\S+)(\s*)=|javascript:|(<\s*)(\/*)script/i,
					},
					{
						key: /.*/,
						value: /data:(?!image\/(png|jpeg|gif|webp))/i,
					},
				],
			},
			{ name: 'script' },
		],
	},
	image: {
		resizeUnit: 'px',
		toolbar: [
			'imageStyle:inline',
			'imageStyle:wrapText',
			'imageStyle:breakText',
			'|',
			'toggleImageCaption',
			'imageTextAlternative',
		],
	},
	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells',
			'tableProperties',
			'tableCellProperties',
		],
		tableProperties: {
			// The default styles for tables in the editor.
			// They should be synchronized with the content styles.
			defaultProperties: {
				borderStyle: 'dashed',
				borderColor: 'hsl(90, 75%, 60%)',
				borderWidth: '3px',
				alignment: 'left',
				width: '550px',
				height: '450px',
			},
			// The default styles for table cells in the editor.
			// They should be synchronized with the content styles.
			tableCellProperties: {
				defaultProperties: {
					horizontalAlignment: 'center',
					verticalAlignment: 'bottom',
					padding: '10px',
				},
			},
		},
	},
	mention: {
		feeds: [
			{
				marker: '@',
				feed: ['@Test'],
				minimumCharacters: 1,
			},
		],
	},
	// This value must be kept in sync with the language defined in webpack.config.js.
	language: 'vi',
};
