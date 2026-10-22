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

		// Running request per section, an older request is aborted by a newer one
		var pendingRequests = {};

		// Bind the event handlers of phpBB and other extensions to a loaded section
		var initSection = function($section) {
			// Ajax links (e.g. collapsible categories)
			$section.find('[data-ajax]').each(function() {
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

			// Page jump dropdown
			$section.find('.dropdown-container').each(function() {
				var $this = $(this);
				phpbb.registerDropdown($this.find('.dropdown-trigger:first'), $this.find('.dropdown'), {
					direction: 'auto',
					verticalDirection: 'auto'
				});
			});

			if (typeof parseDocument === 'function') {
				parseDocument($section);
			}

			$(document).trigger('rtng_section_loaded', [$section]);
		};

		var loadSections = function(url, sectionIds) {
			var controller = window.AbortController ? new AbortController() : null;

			sectionIds.forEach(function(id) {
				if (pendingRequests[id] && pendingRequests[id].abort) {
					pendingRequests[id].abort();
				}
				pendingRequests[id] = controller || {};
				$('#rtng-section-' + id).addClass('rtng-loading');
			});

			var request = pendingRequests[sectionIds[0]];
			var isCurrent = function(id) {
				return pendingRequests[id] === request;
			};

			return fetch(url, {credentials: 'same-origin', signal: controller ? controller.signal : undefined})
				.then(function(response) {
					if (!response.ok) {
						throw new Error(response.statusText);
					}
					return response.text();
				})
				.then(function(html) {
					var doc = new DOMParser().parseFromString(html, 'text/html');
					var currentIds = sectionIds.filter(isCurrent);

					// The page has no longer this section (e.g. session expired), load it the normal way
					if (currentIds.some(function(id) { return !doc.getElementById('rtng-section-' + id); })) {
						window.location.href = url;
						return;
					}

					currentIds.forEach(function(id) {
						var $newSection = $(document.importNode(doc.getElementById('rtng-section-' + id), true));

						delete pendingRequests[id];
						$('#rtng-section-' + id).replaceWith($newSection);

						// Errors of other scripts must not stop the remaining sections
						try {
							initSection($newSection);
						} catch (err) {
							setTimeout(function() {
								throw err;
							});
						}
					});
				}, function(err) {
					// Aborted by a newer request
					if (err && err.name === 'AbortError') {
						return;
					}

					// Fall back to a normal page load
					window.location.href = url;
				});
		};

		$(document).on('click', '.rtng-section .rtng-pagination > ul > li:not(.page-jump) > a[href]', function(e) {
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
