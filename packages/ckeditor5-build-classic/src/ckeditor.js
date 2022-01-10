/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import first from '@ckeditor/ckeditor5-utils/src/first';
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
import PageBreak from '@ckeditor/ckeditor5-page-break/src/pagebreak';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import {
	toWidget,
	viewToModelPositionOutsideModelElement,
	toWidgetEditable
} from '@ckeditor/ckeditor5-widget/src/utils';
import { createDropdown, addListToDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
//
// The draggable-card editor plugin.
//

const LINE_HEIGHT = 'lineHeight';
class CustomFontSizeUI extends Plugin {
	init() {
		this.editor.ui.componentFactory.add('fontSizeDropdown', () => {
			const editor = this.editor;

			const command = editor.commands.get('fontSize');

			// Use original fontSize button - we only changes its behavior.
			const dropdownView = editor.ui.componentFactory.create('fontSize');

			// Show label on dropdown's button.
			dropdownView.buttonView.set('withText', true);

			// Disable icon on the button.
			dropdownView.buttonView.set('icon', false);

			// To hide the icon uncomment below.
			// dropdownView.buttonView.set( 'icon', false );

			// Bind dropdown's button label to fontSize value.
			dropdownView.buttonView.bind('label').to(command, 'value', value => {
				// If no value is set on the command show 'Default' text.
				// Use t() method to make that string translatable.
				return value ? value : '16px'; // The Default size is '16'
			});

			return dropdownView;
		});
	}
}

class CustomFontFamilyUI extends Plugin {
	init() {
		this.editor.ui.componentFactory.add('fontFamilyDropdown', () => {
			const editor = this.editor;
			const t = editor.t;
			const command = editor.commands.get('fontFamily');

			// Use original fontSize button - we only changes its behavior.
			const dropdownView = editor.ui.componentFactory.create('fontFamily');

			// Show label on dropdown's button.
			dropdownView.buttonView.set('withText', true);

			// Disable icon on the button.
			dropdownView.buttonView.set('icon', false);

			// To hide the icon uncomment below.
			// dropdownView.buttonView.set( 'icon', false );

			// Bind dropdown's button label to fontSize value.
			dropdownView.buttonView.bind('label').to(command, 'value', value => {
				// If no value is set on the command show 'Default' text.
				// Use t() method to make that string translatable.
				if (value && value.includes(',')) {
					let valueArr = value.split(",");
					return valueArr[0].replaceAll("'", "");
				}
				return value ? value : t('Default');
			});

			return dropdownView;
		});
	}
}


// #region HCardEditing
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

		this.editor.model.schema.addAttributeCheck(context => {
			if (context.endsWith('draggable-card')) {
				return true;
			}
		});
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		// Data-to-model conversion.
		conversion.for('upcast').elementToElement({
			view: {
				name: 'span',
				classes: ['draggable-card'],
				attributes: [/^data-.*$/]
			},
			model: (viewElement, { writer }) => {
				return writer.createElement(
					'draggable-card',
					getCardDataFromViewElement(viewElement)
				);
			},
			converterPriority: 'high',
		});

		// Model-to-data conversion.
		conversion.for('dataDowncast').elementToElement({
			model: 'draggable-card',
			view: (modelItem, { writer: viewWriter }) => {
				return createCardView(modelItem, viewWriter);
			},
		});

		// Model-to-view conversion.
		conversion.for('editingDowncast').elementToElement({
			model: 'draggable-card',
			view: (modelItem, { writer: viewWriter }) => {
				return toWidget(
					createCardView(modelItem, viewWriter),
					viewWriter
				);
			},
		});

		conversion.for('dataDowncast').add(dispatcher => {
			dispatcher.on('attribute', (evt, data, conversionApi) => {
				// Convert <div> attributes only.
				if (data.item.name != 'draggable-card') {
					return;
				}

				const viewWriter = conversionApi.writer;
				const viewDiv = conversionApi.mapper.toViewElement(data.item);

				// In the model-to-view conversion we convert changes.
				// An attribute can be added or removed or changed.
				// The below code handles all 3 cases.
				if (data.attributeNewValue && data.attributeKey !== "htmlSpan" && data.attributeKey !== "text"
					&& data.attributeKey !== "src" && data.attributeKey !== "class" && data.attributeKey !== "type") {
					viewWriter.setAttribute(data.attributeKey, data.attributeNewValue, viewDiv);
				} else {
					viewWriter.removeAttribute(data.attributeKey, viewDiv);
				}
			});
		});

		conversion.for('editingDowncast').add(dispatcher => {
			dispatcher.on('attribute', (evt, data, conversionApi) => {
				// Convert <draggable-card> attributes only.
				if (data.item.name != 'draggable-card') {
					return;
				}

				const viewWriter = conversionApi.writer;
				const viewDiv = conversionApi.mapper.toViewElement(data.item);

				// In the model-to-view conversion we convert changes.
				// An attribute can be added or removed or changed.
				// The below code handles all 3 cases.
				if (data.attributeNewValue && data.attributeKey !== "htmlSpan" && data.attributeKey !== "text"
					&& data.attributeKey !== "src" && data.attributeKey !== "class" && data.attributeKey !== "type") {
					viewWriter.setAttribute(data.attributeKey, data.attributeNewValue, viewDiv);
				} else {
					viewWriter.removeAttribute(data.attributeKey, viewDiv);
				}
			});
		});

		// Helper method for both downcast converters.
		function createCardView(modelItem, viewWriter) {
			// const email = modelItem.getAttribute( 'email' );
			// const name = modelItem.getAttribute( 'name' );
			// const tel = modelItem.getAttribute( 'tel' );
			const text = modelItem.getAttribute('text');
			const src = modelItem.getAttribute('src');
			const type = modelItem.getAttribute('type');

			let dataAttributes = {};
			for (const item of modelItem.getAttributes()) {
				if (!item[0].includes("text") && !item[0].includes("src") && !item[0].includes("type") && !item[0].includes("htmlSpan") && !item[0].includes("class")) {
					dataAttributes[item[0]] = item[1];
				}
			}


			// console.log(dataAttributes);
			let cardView;
			if (type === 1) {
				cardView = viewWriter.createContainerElement('span', {
					class: 'draggable-card card-header collapse-level-0 d-inline-flex',
					...dataAttributes
				});

				const linkView = viewWriter.createContainerElement('span', {
					class: 'w-100 text-truncate pl-1',
				});

				const iconView = viewWriter.createContainerElement('img', {
					src: src,
				});

				const textView = viewWriter.createContainerElement('span', {
					class: 'card-text type-1',
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
				cardView = viewWriter.createContainerElement('span', {
					class:
						type === 2
							? 'draggable-card display-draggable d-inline-flex'
							: 'draggable-card tag-draggable tag-drag-display d-inline-flex',
					...dataAttributes
				});

				const iconView = viewWriter.createContainerElement('img', {
					src: src,
				});

				const textView = viewWriter.createContainerElement('span', {
					class: type === 2 ? 'card-text type-2' : 'card-text type-3',
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
			const templateData = data.dataTransfer.getData('template');
			if (!textData) {
				return;
			}

			// Use JSON data encoded in the DataTransfer.
			const jsonData = JSON.parse(textData);
			const template = JSON.parse(templateData);

			// Translate the draggable-card data to a view fragment.
			const writer = new UpcastWriter(viewDocument);
			const fragment = writer.createDocumentFragment();

			switch (jsonData.type) {
				case 1:
					generateGroupElement(writer, fragment, jsonData, template);
					break;
				case 2:
					genenerateSmallGroupElement(writer, fragment, jsonData, template);
					break;
				case 3:
					genenerateTagElement(writer, fragment, jsonData, template);
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
				viewElement.is('element', 'span') &&
				viewElement.hasClass('draggable-card')
			) {
				let data = getCardDataFromViewElement(viewElement);
				data.dataTransfer.setData(
					'textValue',
					JSON.stringify({ text: data.text, src: data.src, type: data.type })
				);
				data.dataTransfer.setData(
					'template',
					JSON.stringify(data)
				)
			}
		});
	}
}
// #endregion

//
// draggable-card helper functions.
//
// #region helper functions
function generateGroupElement(writer, fragment, data, templateData) {
	writer.appendChild(
		writer.createElement(
			'span',
			{
				class: 'draggable-card card-header collapse-level-0 d-inline-flex',
				...templateData,
			},
			[
				// writer.createElement( 'a', { href: `mailto:${ contact.email }`, class: 'p-name u-email' }, contact.name ),
				// writer.createElement( 'span', { class: 'p-tel' }, contact.tel )
				writer.createElement(
					'span',
					{
						class: 'w-100 text-truncate pl-1',
					},
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

function genenerateSmallGroupElement(writer, fragment, data, templateData) {
	writer.appendChild(
		writer.createElement(
			'span',
			{
				class: 'draggable-card display-draggable d-inline-flex',
				...templateData,
			},
			[
				writer.createElement(
					'span',
					{ class: 'display-draggable w-100' },
					[
						writer.createElement('img', { src: data.src }),
						writer.createElement(
							'span',
							{ class: 'card-text type-2 uchi-blue' },
							data.text
						),
					]
				),
			]
		),
		fragment
	);
}

function genenerateTagElement(writer, fragment, data, templateData) {
	writer.appendChild(
		writer.createElement(
			'span',
			{
				class: 'draggable-card tag-draggable tag-drag-display d-inline-flex',
				...templateData,
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
	// console.log(children.childCount);
	const textChildren = children.length ? Array.from(children[0].getChildren()) : [];
	let textElement;
	let imgElement;
	let type;
	if (textChildren && textChildren.length) {
		textElement = textChildren.find(
			(element) =>
				element.is('element', 'span') && element.hasClass('card-text')
		);
		imgElement = textChildren.find((element) =>
			element.is('element', 'img')
		);
		if (textElement && textElement.hasClass('type-1')) {
			type = 1;
		} else if (textElement && textElement.hasClass('type-2')) {
			type = 2;
		}
	} else {
		textElement = children.find(
			(element) =>
				element.is('element', 'span') && element.hasClass('card-text')
		);
		imgElement = children.find((element) => element.is('element', 'img'));
		if (textElement && textElement.hasClass('type-2')) {
			type = 2;
		} else if (textElement && textElement.hasClass('type-3')) {
			type = 3;
		}
	}

	let dataAttributes = {};
	for (const item of viewElement.getAttributes()) {
		if (!item[0].includes("text") && !item[0].includes("src") && !item[0].includes("type") && !item[0].includes("htmlSpan") && !item[0].includes("class")) {
			dataAttributes[item[0]] = item[1];
		}
	}

	return {
		text: textElement ? getText(textElement) : "",
		src: imgElement ? imgElement.getAttribute('src') : "",
		type,
		...dataAttributes
	};
}

function getText(viewElement) {
	return Array.from(viewElement.getChildren())
		.map((node) => (node.is('$text') ? node.data : ''))
		.join('');
}
// #endregion

// #region mention
function MentionCustomization(editor) {
	// The upcast converter will convert <a class="mention" href="" data-user-id="">
	// elements to the model 'mention' attribute.
	// Data-to-model conversion.
	editor.conversion.for('upcast').elementToElement({
		view: {
			name: 'span',
			classes: ['draggable-card'],
		},
		model: (viewElement, { writer }) => {
			return writer.createElement(
				'draggable-card',
				getCardDataFromViewElement(viewElement)
			);
		},
		converterPriority: 'high',
	});

	// Model-to-view conversion.
	editor.conversion.for('editingDowncast').elementToElement({
		model: 'draggable-card',
		view: (modelItem, { writer: viewWriter }) => {
			return toWidget(
				createCardView(modelItem, viewWriter),
				viewWriter
			);
		},
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
			cardView = viewWriter.createContainerElement('span', {
				class: 'draggable-card card-header collapse-level-0 d-inline-flex',
			});

			const linkView = viewWriter.createContainerElement('span', {
				class: 'w-100 text-truncate pl-1',
			});

			const iconView = viewWriter.createContainerElement('img', {
				src: src,
			});

			const textView = viewWriter.createContainerElement('span', {
				class: 'card-text type-1',
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
			cardView = viewWriter.createContainerElement('span', {
				class:
					type === 2
						? 'draggable-card display-draggable d-inline-flex'
						: 'draggable-card tag-draggable tag-drag-display d-inline-flex',
			});

			const iconView = viewWriter.createContainerElement('img', {
				src: src,
			});

			const textView = viewWriter.createContainerElement('span', {
				class: type === 2 ? 'card-text type-2' : 'card-text type-3',
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
// #endregion


function ConvertDivAttributes(editor) {
	// Allow <div> elements in the model.
	editor.model.schema.register('div', {
		allowWhere: '$block',
		allowContentOf: '$root'
	});

	// Allow <div> elements in the model to have all attributes.
	editor.model.schema.addAttributeCheck(context => {
		if (context.endsWith('div')) {
			return true;
		}
	});

	// The view-to-model converter converting a view <div> with all its attributes to the model.
	editor.conversion.for('upcast').elementToElement({
		view: 'div',
		model: (viewElement, { writer: modelWriter }) => {
			return modelWriter.createElement('div', viewElement.getAttributes());
		}
	});

	// The model-to-view converter for the <div> element (attributes are converted separately).
	editor.conversion.for('downcast').elementToElement({
		model: 'div',
		view: 'div'
	});

	// The model-to-view converter for <div> attributes.
	// Note that a lower-level, event-based API is used here.
	editor.conversion.for('downcast').add(dispatcher => {
		dispatcher.on('attribute', (evt, data, conversionApi) => {
			// Convert <div> attributes only.
			if (data.item.name != 'div') {
				return;
			}

			const viewWriter = conversionApi.writer;
			const viewDiv = conversionApi.mapper.toViewElement(data.item);

			// In the model-to-view conversion we convert changes.
			// An attribute can be added or removed or changed.
			// The below code handles all 3 cases.
			if ((!data.attributeNewValue && data.attributeKey.includes("ng-switch")) || (data.attributeNewValue && !data.attributeKey.includes("html"))) {
				viewWriter.setAttribute(data.attributeKey, data.attributeNewValue, viewDiv);
			} else {
				viewWriter.removeAttribute(data.attributeKey, viewDiv);
			}
		});
	});
}

function ConvertPAttributes(editor) {
	// Allow <p> elements in the model.
	editor.model.schema.register('p', {
		allowWhere: '$block',
		allowContentOf: '$root'
	});

	// Allow <p> elements in the model to have all attributes.
	editor.model.schema.addAttributeCheck(context => {
		if (context.endsWith('p')) {
			return true;
		}
	});

	// The view-to-model converter converting a view <p> with all its attributes to the model.
	editor.conversion.for('upcast').elementToElement({
		view: 'p',
		model: (viewElement, { writer: modelWriter }) => {
			return modelWriter.createElement('p', viewElement.getAttributes());
		}
	});

	// The model-to-view converter for the <p> element (attributes are converted separately).
	editor.conversion.for('downcast').elementToElement({
		model: 'p',
		view: 'p'
	});

	// The model-to-view converter for <p> attributes.
	// Note that a lower-level, event-based API is used here.
	editor.conversion.for('downcast').add(dispatcher => {
		dispatcher.on('attribute', (evt, data, conversionApi) => {
			// Convert <p> attributes only.
			if (data.item.name != 'p') {
				return;
			}

			const viewWriter = conversionApi.writer;
			const viewp = conversionApi.mapper.toViewElement(data.item);

			// In the model-to-view conversion we convert changes.
			// An attribute can be added or removed or changed.
			// The below code handles all 3 cases.
			if ((!data.attributeNewValue && data.attributeKey.includes("ng-switch")) ||
				(data.attributeNewValue && !data.attributeKey.includes("html") && !data.attributeKey.includes("editp"))) {
				viewWriter.setAttribute(data.attributeKey, data.attributeNewValue, viewp);
			} else {
				viewWriter.removeAttribute(data.attributeKey, viewp);
			}
		});
	});
}

function ConvertSpanAttributes(editor) {
	// Allow <strong> elements in the model.
	editor.model.schema.register('span', {
		allowWhere: '$block',
		allowContentOf: '$root'
	});

	// Allow <span> elements in the model to have all attributes.
	editor.model.schema.addAttributeCheck(context => {
		if (context.endsWith('span')) {
			return true;
		}
	});

	// The view-to-model converter converting a view <span> with all its attributes to the model.
	editor.conversion.for('upcast').elementToElement({
		view: 'span',
		model: (viewElement, { writer: modelWriter }) => {
			return modelWriter.createElement('span', viewElement.getAttributes());
		}
	});

	// The model-to-view converter for the <span> element (attributes are converted separately).
	editor.conversion.for('downcast').elementToElement({
		model: 'span',
		view: 'span'
	});

	// The model-to-view converter for <span> attributes.
	// Note that a lower-level, event-based API is used here.
	editor.conversion.for('downcast').add(dispatcher => {
		dispatcher.on('attribute', (evt, data, conversionApi) => {
			// Convert <span> attributes only.
			if (data.item.name != 'span') {
				return;
			}

			const viewWriter = conversionApi.writer;
			const viewspan = conversionApi.mapper.toViewElement(data.item);

			// In the model-to-view conversion we convert changes.
			// An attribute can be added or removed or changed.
			// The below code handles all 3 cases.
			if ((!data.attributeNewValue && data.attributeKey.includes("ng-switch")) ||
				(data.attributeNewValue && !data.attributeKey.includes("html") && !data.attributeKey.includes("editspan"))) {
				viewWriter.setAttribute(data.attributeKey, data.attributeNewValue, viewspan);
			} else {
				viewWriter.removeAttribute(data.attributeKey, viewspan);
			}
		});
	});
}


class InputContractEditing extends Plugin {
	static get requires() {
		return [Widget];
	}

	init() {
		// console.log( 'PlaceholderEditing#init() got called' );

		this._defineSchema();
		this._defineConverters();

		// this.editor.commands.add( 'inputcontract', new PlaceholderCommand( this.editor ) );

		this.editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement(this.editor.model, viewElement => viewElement.hasClass('inputcontract', 'ng-pristine', 'ng-untouched', 'ng-valid', 'ng-not-empty'))
		);
		// this.editor.config.define( 'inputcontractConfig', {
		//     types: [ 'date', 'first name', 'surname' ]
		// } );

		this.editor.model.schema.addAttributeCheck(context => {
			if (context.endsWith("inputcontract")) {
				return true;
			}
		})
	}


	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register('inputcontract', {
			// Allow wherever text is allowed:
			allowWhere: '$text',

			// The inputcontract will act as an inline node:
			isInline: true,

			// The inline widget is self-contained so it cannot be split by the caret and it can be selected:
			isObject: true,

			// allowContentOf: '$root',

			// The inline widget can have the same attributes as text (for example linkHref, bold).
			// allowAttributesOf: '$text',

			// The inputcontract can have many types, like date, name, surname, etc:
			allowAttributes: ['name', 'editspan', 'ng-model', 'ng-change', 'placholder']
		});
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		conversion.for('upcast').elementToElement({
			view: {
				name: 'span',
				classes: ['inputcontract']
			},
			model: (viewElement, { writer: modelWriter }) => {
				const name = viewElement.getChild(0).data;
				let attributes = viewElement.getAttributes();
				for (let i = 0; i < attributes.length; i++) {
					// console.log("attribute", attributes[i]);
				}
				return modelWriter.createElement('inputcontract', { name, ...viewElement.getAttributes() });
			}
		});

		conversion.for('editingDowncast').elementToElement({
			model: 'inputcontract',
			view: (modelItem, { writer: viewWriter }) => {
				// const widgetElement = createPlaceholderView( modelItem, viewWriter );
				const widgetElement = createPlaceholderView(modelItem, viewWriter);
				// const widgetElement = viewWriter.createEditableElement('span', modelItem.getAttributes());
				// Enable widget handling on a inputcontract element inside the editing view.
				return toWidgetEditable(widgetElement, viewWriter);
			}
		});

		conversion.for('dataDowncast').elementToElement({
			model: 'inputcontract',
			view: (modelItem, { writer: viewWriter }) => createPlaceholderView(modelItem, viewWriter)
		});


		// Helper method for both downcast converters.
		function createPlaceholderView(modelItem, viewWriter) {
			// const name = modelItem.getAttribute( 'name' );
			// console.log(modelItem);
			const name = modelItem.getAttribute("name")
			const inputcontractView = viewWriter.createContainerElement('span', {
				class: 'inputcontract'
			}
				// , {
				// 	isAllowedInsideAttributeElement: true
				// }
			);

			// Insert the inputcontract name (as a text).
			const innerText = viewWriter.createText(name);
			viewWriter.insert(viewWriter.createPositionAt(inputcontractView, 0), innerText);

			return inputcontractView;
		}
	}
}

class LineHeight extends Plugin {
	// static get requires() {
	// 	return { LineHeightEditing, LineHeightUI }
	// }

	// static get pluginName() {
	// 	return 'LineHeight';
	// }

	constructor(editor) {
		super(editor)

		editor.config.define('lineHeight', {
			options: [0, 0.5, 1, 1.5, 2]
		})
	}

	init() {
		const editor = this.editor
		const t = editor.t

		const options = this._getLocalizedOptions();

		const schema = editor.model.schema

		// Filter out unsupported options.
		const enabledOptions = editor.config.get('lineHeight.options').map(option => String(option)).filter(isSupported) // filter

		// Allow alignment attribute on all blocks.
		schema.extend('$block', { allowAttributes: 'lineHeight' })
		editor.model.schema.setAttributeProperties('lineHeight', { isFormatting: true })

		const definition = buildDefinition(enabledOptions/* .filter( option => !isDefault( option ) ) */)

		editor.conversion.attributeToAttribute(definition)

		editor.commands.add('lineHeight', new LineHeightCommand(editor))

		const command = editor.commands.get('lineHeight')

		// Register UI component.
		editor.ui.componentFactory.add('lineHeight', locale => {
			const dropdownView = createDropdown(locale)
			addListToDropdown(dropdownView, _prepareListOptions(options, command))

			// Create dropdown model.
			dropdownView.buttonView.set({
				// label: 'Zeilenhöhe',
				label: t('Line Height'),
				icon: '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"  width="24" height="24" viewBox="0 0 24 24"><path fill="#000000" d="M10,13H22V11H10M10,19H22V17H10M10,7H22V5H10M6,7H8.5L5,3.5L1.5,7H4V17H1.5L5,20.5L8.5,17H6V7Z" /></svg>',
				tooltip: true
			})

			dropdownView.extendTemplate({
				attributes: {
					class: [
						'p0thi-ckeditor5-lineHeight-dropdown'
					]
				}
			})

			dropdownView.bind('isEnabled').to(command)

			// Execute command when an item from the dropdown is selected.
			this.listenTo(dropdownView, 'execute', evt => {
				editor.execute(evt.source.commandName, { value: evt.source.commandParam })
				editor.editing.view.focus()
			})

			return dropdownView
		})


	}

	_getLocalizedOptions() {
		const editor = this.editor
		const t = editor.t

		const localizedTitles = {
			// Default: 'Standard'
			Default: t('Default')
		}

		const options = normalizeOptions(editor.config.get('lineHeight.options').filter(option => isSupported(option)))

		return options.map(option => {
			const title = localizedTitles[option.title]

			if (title && title != option.title) {
				// Clone the option to avoid altering the original `namedPresets` from `./utils.js`.
				option = Object.assign({}, option, { title })
			}

			return option
		})
	}
}


class LineHeightCommand extends Command {
	// constructor( editor ) {
	// 	super( editor );
	// }

	refresh() {
		const firstBlock = first(this.editor.model.document.selection.getSelectedBlocks())

		this.isEnabled = !!firstBlock && this._canSetLineHeight(firstBlock)

		this.value = (this.isEnabled && firstBlock.hasAttribute(LINE_HEIGHT)) ? firstBlock.getAttribute(LINE_HEIGHT) : '1'
	}

	execute(options = {}) {
		const editor = this.editor
		const model = editor.model
		const doc = model.document

		// console.log(model.schema.getDefinitions())

		// const value = '0'
		const value = options.value

		model.change(writer => {
			const blocks = Array.from(doc.selection.getSelectedBlocks()).filter(block => this._canSetLineHeight(block))
			const currentLineHeight = blocks[0].getAttribute(LINE_HEIGHT)

			const removeLineHeight = /* isDefault( value ) ||  */currentLineHeight === value || typeof value === 'undefined'

			// console.log(value, currentLineHeight === value, typeof value === 'undefined')

			if (removeLineHeight) {
				removeLineHeightFromSelection(blocks, writer)
			}
			else {
				setLineHeightOnSelection(blocks, writer, value)
			}
		})
	}

	_canSetLineHeight(block) {
		return this.editor.model.schema.checkAttribute(block, LINE_HEIGHT)
	}
}

class LineHeightUI extends Plugin {
	init() {
		const editor = this.editor
		const t = editor.t

		const options = this._getLocalizedOptions()

		const command = editor.commands.get('lineHeight')

		// Register UI component.
		editor.ui.componentFactory.add('lineHeight', locale => {
			const dropdownView = createDropdown(locale)
			addListToDropdown(dropdownView, _prepareListOptions(options, command))

			// Create dropdown model.
			dropdownView.buttonView.set({
				// label: 'Zeilenhöhe',
				label: t('Line Height'),
				icon: editor.config.get('lineHeight.icon') || '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"  width="24" height="24" viewBox="0 0 24 24"><path fill="#000000" d="M10,13H22V11H10M10,19H22V17H10M10,7H22V5H10M6,7H8.5L5,3.5L1.5,7H4V17H1.5L5,20.5L8.5,17H6V7Z" /></svg>',
				tooltip: true
			})

			dropdownView.extendTemplate({
				attributes: {
					class: [
						'p0thi-ckeditor5-lineHeight-dropdown'
					]
				}
			})

			dropdownView.bind('isEnabled').to(command)

			// Execute command when an item from the dropdown is selected.
			this.listenTo(dropdownView, 'execute', evt => {
				editor.execute(evt.source.commandName, { value: evt.source.commandParam })
				editor.editing.view.focus()
			})

			return dropdownView
		})
	}

	_getLocalizedOptions() {
		const editor = this.editor
		const t = editor.t

		const localizedTitles = {
			// Default: 'Standard'
			Default: t('Default')
		}

		const options = normalizeOptions(editor.config.get('lineHeight.options').filter(option => isSupported(option)))

		return options.map(option => {
			const title = localizedTitles[option.title]

			if (title && title != option.title) {
				// Clone the option to avoid altering the original `namedPresets` from `./utils.js`.
				option = Object.assign({}, option, { title })
			}

			return option
		})
	}
}

class LineHeightEditing extends Plugin {
	constructor(editor) {
		super(editor)

		editor.config.define('lineHeight', {
			options: [0, 0.5, 1, 1.5, 2]
		})
	}

	init() {
		const editor = this.editor
		const schema = editor.model.schema

		// Filter out unsupported options.
		const enabledOptions = editor.config.get('lineHeight.options').map(option => String(option)).filter(isSupported) // filter

		// Allow alignment attribute on all blocks.
		schema.extend('$block', { allowAttributes: 'lineHeight' })
		editor.model.schema.setAttributeProperties('lineHeight', { isFormatting: true })

		const definition = buildDefinition(enabledOptions/* .filter( option => !isDefault( option ) ) */)

		editor.conversion.attributeToAttribute(definition)

		editor.commands.add('lineHeight', new LineHeightCommand(editor))
	}
}


function isSupported(option) {
	// return supportedOptions.includes( option );
	return /^\d(.\d+)?$/mg.test(String(option))
}

function normalizeOptions(configuredOptions) {
	return configuredOptions.map(optionDefinition).filter(option => !!option);
}

function buildDefinition(options) {
	const definition = {
		model: {
			key: 'lineHeight',
			values: options.slice()
		},
		view: {}
	};

	for (const option of options) {
		definition.view[option] = {
			key: 'style',
			value: {
				'line-height': option
			}
		};
	}

	return definition;
}

function optionDefinition(option) {
	if (typeof option === 'object') {
		return option
	}

	if (option === 'default') {
		return {
			model: undefined,
			title: 'Default'
		};
	}

	const sizePreset = parseFloat(option)

	if (isNaN(sizePreset)) {
		return
	}

	return generatePixelPreset(sizePreset)
}

function generatePixelPreset(size) {
	const sizeName = String(size)

	return {
		title: sizeName,
		model: size,
		view: {
			name: 'span',
			styles: {
				'line-height': sizeName
			},
			priority: 5
		}
	}
}

function _prepareListOptions(options, command) {
	const itemDefinitions = new Collection()

	for (const option of options) {
		const def = {
			type: 'button',
			model: new Model({
				commandName: 'lineHeight',
				commandParam: option.model,
				label: option.title,
				class: 'p0thi-ckeditor5-lineHeight-dropdown',
				withText: true
			})
		}

		if (option.view && option.view.classes) {
			def.model.set('class', `${def.model.class} ${option.view.classes}`)
		}

		def.model.bind('isOn').to(command, 'value', value => {
			const newValue = value ? parseFloat(value) : value
			return newValue === option.model
		})

		// Add the option to the collection.
		itemDefinitions.add(def)
	}

	return itemDefinitions
}

function removeLineHeightFromSelection(blocks, writer) {
	for (const block of blocks) {
		// console.log('removing')
		writer.removeAttribute(LINE_HEIGHT, block)
	}
}

function setLineHeightOnSelection(blocks, writer, lineHeight) {
	for (const block of blocks) {
		// console.log('setting', block, lineHeight)
		writer.setAttribute(LINE_HEIGHT, lineHeight, block)
	}
}

// The editor creator to use.

export default class ClassicEditor extends ClassicEditorBase { }

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
	MentionCustomization,
	PageBreak,
	ConvertDivAttributes,
	CustomFontFamilyUI,
	CustomFontSizeUI,
	LineHeight,
	// InputContractEditing,
	// ConvertPAttributes,
	// ConvertSpanAttributes,
	// ConvertStrongAttributes
];

// Editor configuration.
ClassicEditor.defaultConfig = {
	toolbar: {
		shouldNotGroupWhenFull: true,
		items: [
			'heading',
			'|',
			'fontFamilyDropdown',
			'fontSizeDropdown',
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
			'lineHeight',
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
			'pageBreak',
			'sourceEditing',
		],
	},
	htmlSupport: {
		allow: [{ name: /.*/, attributes: !0, styles: !0 },
		{
			name: 'span',
			classes: !0,
			attributes: !0,
			styles: !0
		}],
		// allow: [
		// 	{
		// 		name: /^(span|section|article|table|td|figure)$/,
		// 		attributes: true,
		// 		classes: true,
		// 		styles: true,
		// 	},
		// 	{
		// 		name: /^(span|blockquote)$/,
		// 		styles: true,
		// 		classes: true,
		// 		attributes: true,
		// 	},
		// 	{
		// 		name: 'font',
		// 		attributes: true,
		// 	},
		// 	{
		// 		name: 'p',
		// 		classes: true,
		// 		styles: true,
		// 	},
		// ],
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
	fontSize: {
		options: [
			9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72
		],
		supportAllValues: true,
	},
	fontFamily: {
		supportAllValues: true,
	},
	lineHeight: { // specify your otions in the lineHeight config object. Default values are [ 0, 0.5, 1, 1.5, 2 ]
		options: [0.5, 1, 1.5, 2, 2.5]
	},
	// This value must be kept in sync with the language defined in webpack.config.js.
	language: 'vi',
};
