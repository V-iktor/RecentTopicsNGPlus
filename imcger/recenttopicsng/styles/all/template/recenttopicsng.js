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

		/**
		 * Client side pagination. Sections with data-rtng-client="1" contain the
		 * topics of all their pages, a page change only shows other rows.
		 */
		var isClientSection = function($section) {
			return $section.attr('data-rtng-client') === '1';
		};

		// URL of the current page with a new start value for one section
		var pageUrl = function(param, start) {
			var url = new URL(window.location.href);

			if (start > 0) {
				url.searchParams.set(param, start);
			} else {
				url.searchParams.delete(param);
			}
			url.hash = '';

			return url.toString();
		};

		// Same list of page links as phpbb\pagination::generate_template_pagination()
		var buildPageLinks = function($pagination, param, perPage, totalPages, onPage) {
			var startPage = (totalPages > 5) ? Math.min(Math.max(1, onPage - 2), totalPages - 4) : 1;
			var endPage = (totalPages > 5) ? Math.max(Math.min(totalPages, onPage + 2), 5) : totalPages;
			var items = [];

			var link = function(page) {
				return $('<a class="button" role="button"></a>').attr('href', pageUrl(param, (page - 1) * perPage));
			};

			var arrow = function(page, type) {
				var flow = $pagination.attr(type === 'prev' ? 'data-flow-begin' : 'data-flow-end');
				var label = $pagination.attr(type === 'prev' ? 'data-lang-previous' : 'data-lang-next');

				return $('<li class="arrow"></li>').addClass(type === 'prev' ? 'previous' : 'next').append(
					link(page).addClass('button-icon-only').attr('rel', type).append(
						$('<i class="icon fa-fw" aria-hidden="true"></i>').addClass('fa-chevron-' + flow),
						$('<span class="sr-only"></span>').text(label)
					)
				);
			};

			if (onPage !== 1) {
				items.push(arrow(onPage - 1, 'prev'));
			}

			var atPage = 1;
			do {
				if ((atPage === 2 && startPage > 2) || (atPage === totalPages - 1 && endPage < totalPages - 1)) {
					items.push($('<li class="ellipsis" role="separator"></li>').append($('<span></span>').text($pagination.attr('data-lang-ellipsis'))));
				} else if (atPage === onPage) {
					items.push($('<li class="active"></li>').append($('<span tabindex="-1" aria-current="page"></span>').text(atPage)));
				} else {
					items.push($('<li></li>').append(link(atPage).text(atPage)));
				}

				if (atPage === 2 && atPage < startPage - 1) {
					atPage = startPage;
				} else if (atPage === endPage && endPage < totalPages - 1) {
					atPage = totalPages - 1;
				} else {
					atPage++;
				}
			} while (atPage <= totalPages);

			if (onPage !== totalPages) {
				items.push(arrow(onPage + 1, 'next'));
			}

			return items;
		};

		// Show one page of a client side paginated section
		var showClientPage = function($section, page) {
			var param = $section.attr('data-rtng-param');
			var perPage = parseInt($section.attr('data-rtng-per-page'), 10) || 1;
			var totalPages = parseInt($section.attr('data-rtng-total-pages'), 10) || 1;

			page = Math.min(Math.max(1, page), totalPages);

			$section.find('li.row[data-rtng-page]').each(function() {
				this.hidden = parseInt(this.getAttribute('data-rtng-page'), 10) !== page;
			});

			// Hide boxes (topic type groups) without a topic on this page
			$section.find('.rtng-box').each(function() {
				var $rows = $(this).find('li.row[data-rtng-page]');

				if ($rows.length) {
					this.hidden = !$rows.filter(function() {
						return !this.hidden;
					}).length;
				}
			});

			$section.find('.rtng-pagination').each(function() {
				var $pagination = $(this);
				var $list = $pagination.children('ul');
				var focused = document.activeElement;
				var hadFocus = $.contains($list.get(0), focused) && !$(focused).closest('.page-jump').length;
				var focusedRel = hadFocus ? focused.getAttribute('rel') : null;

				$list.children('li:not(.page-jump)').remove();
				$list.append(buildPageLinks($pagination, param, perPage, totalPages, page));

				// Keep the keyboard focus in the page links
				if (hadFocus) {
					var $target = focusedRel ? $list.find('a[rel="' + focusedRel + '"]') : $();
					($target.length ? $target : $list.find('li.active > span')).trigger('focus');
				}
			});

			return page;
		};

		// Change the page of a section, client side or by loading the section
		var changePage = function($section, start) {
			var param = $section.attr('data-rtng-param');
			var sectionId = $section.attr('data-rtng-section');
			var url = pageUrl(param, start);

			window.history.pushState({rtng: true}, '', url);
			currentSearch = window.location.search;

			var scrollToSection = function() {
				var $current = $('#rtng-section-' + sectionId);

				if ($current.length && $current.offset().top < $(window).scrollTop()) {
					$('html, body').scrollTop($current.offset().top);
				}
			};

			if (isClientSection($section)) {
				showClientPage($section, Math.floor(start / (parseInt($section.attr('data-rtng-per-page'), 10) || 1)) + 1);
				scrollToSection();
			} else {
				loadSections(url, [sectionId]).then(scrollToSection);
			}
		};

		var pageLinks = '.rtng-section .rtng-pagination > ul > li:not(.page-jump) > a[href]';

		// Start value of the link's own section. The start values of all other
		// sections in the link may be outdated, the current URL has the right ones.
		var linkStart = function(link) {
			var param = $(link).closest('.rtng-section').attr('data-rtng-param');
			return parseInt(new URL(link.href, window.location.href).searchParams.get(param), 10) || 0;
		};

		// Base the link on the current URL before it is opened in a new tab or window,
		// copied or dragged, so the pages of the other sections are kept
		$(document).on('mousedown auxclick contextmenu dragstart', pageLinks, function() {
			var param = $(this).closest('.rtng-section').attr('data-rtng-param');

			if (param) {
				this.href = pageUrl(param, linkStart(this));
			}
		});

		$(document).on('click', pageLinks, function(e) {
			var $section = $(this).closest('.rtng-section');
			var param = $section.attr('data-rtng-param');

			if (!param) {
				return;
			}

			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) {
				this.href = pageUrl(param, linkStart(this));
				return;
			}

			e.preventDefault();
			changePage($section, linkStart(this));
		});

		// Page jump box of client side paginated sections. Runs in the capture
		// phase, so the page load of phpBB's own page jump handler is skipped.
		var clientPageJump = function(e, input) {
			var $section = $(input).closest('.rtng-section');
			var perPage = parseInt($section.attr('data-rtng-per-page'), 10) || 1;
			var totalPages = parseInt($section.attr('data-rtng-total-pages'), 10) || 1;
			var page = parseInt(input.value, 10);

			e.preventDefault();
			e.stopPropagation();

			if (page > 0) {
				changePage($section, (Math.min(page, totalPages) - 1) * perPage);
			}

			// Close the dropdown
			$('body').trigger('click');
		};

		document.addEventListener('click', function(e) {
			var button = e.target.closest && e.target.closest('.rtng-section[data-rtng-client="1"] .page-jump-form input[type="button"]');

			if (button) {
				clientPageJump(e, $(button).siblings('input.inputbox').get(0));
			}
		}, true);

		document.addEventListener('keypress', function(e) {
			var input = e.target.closest && e.target.closest('.rtng-section[data-rtng-client="1"] .page-jump-form input.inputbox');

			if (input && (e.which === 13 || e.keyCode === 13)) {
				clientPageJump(e, input);
			}
		}, true);

		// Hide the topic type boxes without topics on the current page
		$('.rtng-section[data-rtng-client="1"]').each(function() {
			var $section = $(this);
			showClientPage($section, parseInt($section.attr('data-rtng-current-page'), 10) || 1);
		});

		// Back and forward buttons, show the pages of the current URL
		$(window).on('popstate', function() {
			// Ignore changes of the hash only
			if (window.location.search === currentSearch) {
				return;
			}
			currentSearch = window.location.search;

			var params = new URL(window.location.href).searchParams;
			var sectionIds = [];

			$('.rtng-section').each(function() {
				var $section = $(this);

				if (isClientSection($section)) {
					var perPage = parseInt($section.attr('data-rtng-per-page'), 10) || 1;
					var start = parseInt(params.get($section.attr('data-rtng-param')), 10) || 0;
					showClientPage($section, Math.floor(start / perPage) + 1);
				} else {
					sectionIds.push($section.attr('data-rtng-section'));
				}
			});

			if (sectionIds.length) {
				loadSections(window.location.href, sectionIds);
			}
		});
	}
);
