/**
 *
 * Recent Topics NG. An extension for the phpBB Forum Software package.
 *
 * @copyright (c) 2022, IMC, https://github.com/IMC-GER / LukeWCS, https://github.com/LukeWCS
 * @copyright (c) 2017, Sajaki, https://www.avathar.be
 * @copyright (c) 2015, PayBas
 * @license GNU General Public License, version 2 (GPL-2.0-only)
 *
 * Based on the original NV Recent Topics by Joas Schilling (nickvergessen)
 */

var RecentTopicsNG = {};

(function ($) {	// IIFE start

'use strict';

class LukeWCSphpBBConfirmBox {
/*
* phpBB ConfirmBox class for checkboxes and yes/no radio buttons - v1.5.1
* @copyright (c) 2023, LukeWCS, https://www.wcsaga.org
* @license GNU General Public License, version 2 (GPL-2.0-only)
*/
	constructor(submitSelector, animDuration = 0) {
		let _this = this;
		this.$submitObject	= $(submitSelector);
		this.$formObject	= this.$submitObject.parents('form');
		this.animDuration	= animDuration;

		this.$formObject.find('div.lukewcs_confirmbox').each(function () {
			$('input[name="' + $(this).attr('data-name') + '"]').on('change', _this.#Show);
			$(this).find('input[type="button"]')				.on('click'	, _this.#Button);
		});
		this.$formObject										.on('reset'	, _this.HideAll);
	}

	#Show = (e) => {
		const $elementObject	= $('input[name="' + e.target.name + '"]');
		const $confirmBoxObject	= $('div.lukewcs_confirmbox[data-name="' + e.target.name + '"]');

		if ($elementObject.prop('checked') != $confirmBoxObject.attr('data-default')) {
			this.#changeBoxState($elementObject, $confirmBoxObject, true);
		}
	}

	#Button = (e) => {
		const elementName		= $(e.target).parents('div.lukewcs_confirmbox').attr('data-name');
		const $elementObject	= $('input[name="' + elementName + '"]');
		const $confirmBoxObject	= $('div.lukewcs_confirmbox[data-name="' + elementName + '"]');
		const elementType		= $elementObject.attr('type');

		if (e.target.name == 'lukewcs_confirmbox_no') {
			if (elementType == 'checkbox') {
				$elementObject.prop('checked', $confirmBoxObject.attr('data-default'));
			} else if (elementType == 'radio') {
				$elementObject.filter('[value="' + ($confirmBoxObject.attr('data-default') ? '1' : '0') + '"]').prop('checked', true);
			}
		}
		this.#changeBoxState($elementObject, $confirmBoxObject, null);
	}

	HideAll = () => {
		const $elementObject	= this.$formObject.find('input.lukewcs_confirmbox_active');
		const $confirmBoxObject	= this.$formObject.find('div.lukewcs_confirmbox');

		this.#changeBoxState($elementObject, $confirmBoxObject, false);
	}

	#changeBoxState = ($elementObject, $confirmBoxObject, showBox) => {
		$elementObject		.prop('disabled', !!showBox);
		$elementObject		.toggleClass('lukewcs_confirmbox_active', !!showBox);
		$confirmBoxObject	[showBox ? 'show' : 'hide'](this.animDuration);
		this.$submitObject	.prop('disabled', showBox ?? this.$formObject.find('input.lukewcs_confirmbox_active').length);
	}
}

class RecentTopicsNGSections {
/*
* Add, remove and sort the recent topics sections
*/
	constructor(listSelector, templateSelector, addSelector) {
		this.$list		= $(listSelector);
		this.$template	= $(templateSelector);
		this.$add		= $(addSelector);
		this.nextId		= parseInt(this.$add.attr('data-next-id'), 10) || 1;

		this.$add	.on('click', this.#Add);
		this.$list	.on('click', 'input[data-rtng-action]', this.#Action);
		this.#UpdateButtons();
	}

	#Add = () => {
		this.$list.append(this.$template.html().replace(/__ID__/g, this.nextId++));
		this.#UpdateButtons();
	}

	#Action = (e) => {
		const $row = $(e.target).closest('.rtng-section-row');

		switch ($(e.target).attr('data-rtng-action')) {
			case 'up':
				$row.prev('.rtng-section-row').before($row);
			break;

			case 'down':
				$row.next('.rtng-section-row').after($row);
			break;

			case 'delete':
				$row.remove();
			break;
		}
		this.#UpdateButtons();
	}

	#UpdateButtons = () => {
		const $rows = this.$list.children('.rtng-section-row');

		$rows.find('input[data-rtng-action="delete"]')	.prop('disabled', $rows.length < 2);
		$rows.find('input[data-rtng-action="up"]')		.prop('disabled', false);
		$rows.find('input[data-rtng-action="down"]')	.prop('disabled', false);
		$rows.first().find('input[data-rtng-action="up"]')	.prop('disabled', true);
		$rows.last().find('input[data-rtng-action="down"]')	.prop('disabled', true);
	}
}

// Register events

$(window).ready(function() {
	RecentTopicsNG.ConfirmBox = new LukeWCSphpBBConfirmBox('input[name="submit"]', 300);
	RecentTopicsNG.Sections	  = new RecentTopicsNGSections('#rtng_section_list', '#rtng_section_template', '#rtng_section_add');
});

})(jQuery);	// IIFE end
