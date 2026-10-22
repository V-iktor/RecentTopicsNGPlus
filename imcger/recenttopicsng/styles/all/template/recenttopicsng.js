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

jQuery(
	function($) {
		var phpbbCallback = phpbb.ajaxCallbacks['mark_forums_read'];
		phpbb.addAjaxCallback(
			'mark_forums_read', function(res) {
				phpbbCallback(res);
				phpbb.ajaxCallbacks.mark_topics_read.call(this, res, false);
			}
		);

		/**
		 * Paginate the recent topics sections without reloading the whole page.
		 * Every section has its own start parameter in the URL, so the
		 * pages of the other sections are kept and links can be shared.
		 */
		if (!window.history || !window.history.pushState || !window.fetch || !window.DOMParser) {
			return;
		}

		var currentSearch = window.location.search;

		var loadSections = function(url, sectionIds) {
			var $sections = $(sectionIds.map(function(id) {
				return '#rtng-section-' + id;
			}).join(','));

			$sections.addClass('rtng-loading');

			return fetch(url, {credentials: 'same-origin'})
				.then(function(response) {
					if (!response.ok) {
						throw new Error(response.statusText);
					}
					return response.text();
				})
				.then(function(html) {
					var doc = new DOMParser().parseFromString(html, 'text/html');

					sectionIds.forEach(function(id) {
						var newSection = doc.getElementById('rtng-section-' + id);
						var $oldSection = $('#rtng-section-' + id);

						if (newSection && $oldSection.length) {
							var $newSection = $(document.importNode(newSection, true));
							$oldSection.replaceWith($newSection);

							// Rebind ajax links (e.g. collapsible categories)
							$newSection.find('[data-ajax]').each(function() {
								var $this = $(this);
								var ajax = $this.attr('data-ajax');
								var filter = $this.attr('data-filter');

								if (ajax !== 'false') {
									phpbb.ajaxify({
										selector: this,
										refresh: $this.attr('data-refresh') !== undefined,
										filter: (filter !== undefined) ? phpbb.getFunctionByName(filter) : null,
										callback: (ajax !== 'true') ? ajax : null
									});
								}
							});

							$(document).trigger('rtng_section_loaded', [$newSection]);
						}
					});
				})
				.catch(function() {
					// Fall back to a normal page load
					window.location.href = url;
				})
				.finally(function() {
					$sections.removeClass('rtng-loading');
				});
		};

		$(document).on('click', '.rtng-section .rtng-pagination a[href]', function(e) {
			var $section = $(this).closest('.rtng-section');
			var param = $section.attr('data-rtng-param');
			var sectionId = $section.attr('data-rtng-section');

			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2 || !param) {
				return;
			}

			e.preventDefault();

			// Take only the start value of this section from the link, the
			// start values of all other sections remain as they are.
			var linkUrl = new URL(this.href, window.location.href);
			var pageUrl = new URL(window.location.href);
			var start = parseInt(linkUrl.searchParams.get(param), 10) || 0;

			if (start > 0) {
				pageUrl.searchParams.set(param, start);
			} else {
				pageUrl.searchParams.delete(param);
			}
			pageUrl.hash = '';

			window.history.pushState({rtng: true}, '', pageUrl.toString());
			currentSearch = window.location.search;

			loadSections(pageUrl.toString(), [sectionId]).then(function() {
				var $newSection = $('#rtng-section-' + sectionId);

				if ($newSection.length && $newSection.offset().top < $(window).scrollTop()) {
					$('html, body').scrollTop($newSection.offset().top);
				}
			});
		});

		// Back and forward buttons, reload all sections for the current URL
		$(window).on('popstate', function() {
			// Ignore changes of the hash only
			if (window.location.search === currentSearch) {
				return;
			}
			currentSearch = window.location.search;

			var sectionIds = $('.rtng-section').map(function() {
				return $(this).attr('data-rtng-section');
			}).get();

			if (sectionIds.length) {
				loadSections(window.location.href, sectionIds);
			}
		});
	}
);
