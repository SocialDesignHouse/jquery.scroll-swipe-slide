/*===================================================================
 *
 * Social Design House
 * Delicious Design, Start to Finish
 *
 * @author		Eric Allen
 * @copyright		Copyright (c) 2012 Social Design House
 * @license		MIT
 * @link		http://socialdesignhouse.com/
 * @docs		http://socialdesignhouse.com/
 * @version		0.1
 * @deps		jQuery, jQuery Mousewheel
 * @optional		jQuery++ Swipe Events, jQuery Easing, History JS
 *			jQuery ScrollTo
 *
=================================================================*/

	//close out any previous JS with a semi-colon, just in case
	;(function($) {
		
		//define plug-in jquery function
		$.fn.scrollSwipeSlide = function(option, settings) {
			//if scrollSwipeSlide was called with options
			if(typeof option === 'object') {
				settings = option;
			//if scrollSwipeSlide was called with an option name
			} else if(typeof option === 'string') {
				//return the value of that option
				var data = this.data('_scrollSwipeSlide');
				if(data) {
					if($.fn.scrollSwipeSlide.default_settings[option] !== undefined) {
						if(settings !== undefined) {
							data.settings[option] = settings;
							return true;
						} else {
							return data.settings[option];
						}
					} else {
						return false;
					}
				} else {
					return false;
				}
			}

			//extend settings based on the defined defaults and what was provided in the class declaration
			settings = $.extend({}, $.fn.scrollSwipeSlide.default_settings, settings || {});

			//what to do with each instance of the selector passed to the class
			return this.each(function() {
				//save $(this) and settings to variables for quicker referencing
				var $elem = $(this);
				var $settings = jQuery.extend(true,{},settings);
				//initialize class
				var scrollswipeslide = new scrollSwipeSlide($settings);
				//save the element to the object
				scrollswipeslide.scrollswipeslide = $elem;
				//initialize the object
				scrollswipeslide.initialize();
				//save information to data attribute on the element
				$elem.data('_scrollSwipeSlide', scrollswipeslide);
			});
		};

		//set up default options
		$.fn.scrollSwipeSlide.default_settings = {
			use_scrollto : true, //requires jQuery ScrollTo (this is included in the scripts folder)
			use_swipe : true, //requires a swipe events plug-in (jQuery++ Swipe Events with swipe variation threshhold is included in the scripts folder)
			use_keypress : true,
			use_history : false, //requires History JS (this is included in the scripts folder)
			base_url : '', //required if you want to use History JS
			multi_dir : false, //not implemented yet
			container : '.project',
			container_before : null,
			container_after : null,
			slides : '.slide',
			slides_before : null, //not implemented yet
			slides_after : null, //not implemented yet
			nav : '.slide-nav',
			slideshow_class : '.slideshow',
			easing : 'easeInOutExpo', //requires easing plug-in (this is included in the scrips folder)
			//less than 1000 and it double scrolls when using Apple's inertial scrolling
			scroll_time : 1000,
			scroll_lockout : 20,
			width : '100%',
			height : '100%',
			//if you have a title page that you don't want to include in your slides
			skip_first : false,
			callback : null
		};

		//add settings to object
		function scrollSwipeSlide(settings) {
			this.scrollswipeslide = null;
			this.settings = settings;
			return this;
		}

		//set up object methods
		scrollSwipeSlide.prototype = {
			
			//set up this instance
			initialize : function() {
				var $this = this;
				var settings = $this.settings;

				//set up the environment
				$this.build_nav();

				//check for multi-directional
				if(settings.multi_dir) {
					$this.multi_directional();
				}

				//set the css for the slideshow
				$this.set_css();

				//initialize values for scrolling logic
				$this.scrolling = false;
				$this.this_scroll = 0;
				$this.last_scroll = 0;
				$this.container = 0;
				$this.slide = 0;

				//check if History is enabled
				if(settings.use_history && settings.base_url) {
					var History = window.History; // Note: We are using a capital H instead of a lower h
					if(!History.enabled) {
						// History.js is disabled for this browser.
						$this.history = false;
						// This is because we can optionally choose to support HTML4 browsers or not.
						return false;
					} else {
						$this.history = true;
					}
				} else {
					$this.history = false;
				}

				$this.check_url();

				//bind events
				$this.bind_events();

				//run user-defined callback function
				settings.callback.call(this);
			},
			
			//bind event handlers
			bind_events : function() {
				var $this = this;
				$this.disable_scroll();

				//on resize
				$(window).resize(function() {
					//reconfigure the slide size to fit the window
					$this.set_css();
				});

				$this.enable_mousewheel();
				$this.bind_nav();

				if($this.settings.use_keypress) {
					$this.enable_keys();
				}
				if($this.settings.use_swipe) {
					$this.enable_swipe();
				}
				if($this.settings.use_history && $this.history) {
					$this.bind_statechange();
				}
			},

			//style necessary parts
			set_css : function() {
				var $this = this;
				var settings = $this.settings;
				//set up slideshow container to scroll vertically
				$(settings.slideshow_class).css({
					'overflow' : 'hidden'
				});
				//hide overflow on slides
				$(settings.container).css({
					'overflow' : 'hidden'
				});
				//get height & width
				$this.win_height = $(window).height();
				$this.win_width = $(window).width();
				//set width for 100%
				if(settings.width == '100%') {
					$(settings.slideshow_class).css({
						'width' : $this.win_width + 'px'
					});
					//account for browser scroll bar width when setting container width
					var tmp_width = $this.win_width - 20;
					$(settings.container).css({
						'width' : tmp_width + 'px'
					});
				}
				//set height for 100%
				if(settings.height == '100%') {
					$(settings.slideshow_class).css({
						'height' : $this.win_height + 'px'
					});
					$(settings.container).css({
						'height' : $this.win_height + 'px'
					});
				}
				//set nav height and center it
				var nav_height = 20 * $(settings.nav).find('.slide-circle').length;
				var nav_pad = ($this.win_height - nav_height) / 2;
				$(settings.nav).css({
					'margin' : nav_pad + 'px 0'
				});
				if(settings.multi_dir) {
					$this.multi_dir_css();
				}
			},
			
			//create the navigation
			build_nav : function() {
				var $this = this;
				var settings = $this.settings;
				var nav = '<nav class="' + settings.nav.substring(1) + '">' + '<ul>';
				var num_projs = $(settings.slideshow_class).find(settings.container).length;
				for(var i = 0; i < num_projs; i++) {
					var add_class = '';
					if(i === 0) {
						add_class = ' active';
					}
					nav += '<li class="slide-circle' + add_class + '"></li>';
				}
				var which_con = settings.container + ':first-child';
				$(settings.slideshow_class).find(which_con).addClass('active');
				nav += '</ul>' +
				'</nav>';
				$this.scrollswipeslide.prepend(nav);
			},
			
			//slide up or down
			slide_it : function() {
				var $this = this;
				var settings = $this.settings;
				//make sure a direction has been specified
				if($this.direction) {
					//make sure we aren't firing other scroll events
					$this.scrolling = true;
					var $go_to, index;
					//check the direction parameter so we can pass a value to the funcion that retrieves the element
					//going up
					if($this.direction == 'u') {
						//if there is a previous item
						if($(settings.slideshow_class).find('.active').prev(settings.container).length > 0) {
							$this.go_to = $(settings.slideshow_class).find('.active').prev(settings.container);
							$this.slide_vertical();
						//we're at the top
						} else {
							return false;
						}
					//going down
					} else if($this.direction == 'd') {
						//if there is a next item
						if($(settings.slideshow_class).find('.active').next(settings.container).length > 0) {
							$this.go_to = $(settings.slideshow_class).find('.active').next(settings.container);
							$this.slide_vertical();
						//we're at the bottom
						} else {
							return false;
						}
					//going left
					} else if($this.direction == 'r') {
						//if there is a next item
						if($(settings.container + ':eq(' + $this.container + ')').find('.current').next(settings.slides).length > 0) {
							$this.go_to = $(settings.container + ':eq(' + $this.container + ')').find('.current').next(settings.slides);
							$this.slide_horizontal();
						//we're all the way to the left
						} else {
							return false;
						}
					//going right
					} else if($this.direction == 'l') {
						//if there is a next item
						if($(settings.container + ':eq(' + $this.container + ')').find('.current').prev(settings.slides).length > 0) {
							$this.go_to = $(settings.container + ':eq(' + $this.container + ')').find('.current').prev(settings.slides);
							$this.slide_horizontal();
						//we're all the way to the right
						} else {
							return false;
						}
					}
				}
			},

			//move it up and down
			slide_vertical : function() {
				var $this = this;
				var settings = $this.settings;
				if($this.go_to) {
					var go_to = $this.go_to;
					//set index for desired element
					index = go_to.index();
					$this.container = index;
					if(settings.container_before) {
						settings.container_before.call(this);
					}
					//switch active states on the nav
					$(settings.nav).find('.active').removeClass('active');
					$(settings.nav).find('.slide-circle:eq(' + index + ')').addClass('active');
					//scroll
					$(settings.slideshow_class).stop(true,true).scrollTo(
						go_to, settings.scroll_time, {
							easing : settings.easing,
							onAfter : function() {
								//increment this_scroll
								$this.this_scroll++;
								scroll_timeout = setTimeout(function() { $this.scrolling = false; }, settings.scroll_lockout);
								$(settings.container + ':eq(' + index + ')').find(settings.slides + ':first').addClass('current');
							}
						}
					);
					//set history
					$this.current = go_to;
					$this.update_history();
					//if we aren't already on the active item
					if(!go_to.hasClass('active')) {
						$(settings.slideshow_class).find('.active').removeClass('active');
						go_to.addClass('active');
					}
					if(settings.container_after) {
						settings.container_after.call(this);
					}
				}
			},

			//update browser history
			update_history : function() {
				var $this = this;
				if($this.history) {
					var $current = $this.current;
					var id = $current.attr('id');
					var title = $current.data('title');
					var url = '/' + $current.data('slug');
					var year = $current.data('year');
					var state_obj = {
						id : id,
						title : title,
						year : year
					};
					History.pushState(state_obj, title, url);
				} else {
					return false;
				}
			},

			//check for a url different from the base_url option when using History JS
			check_url : function() {
				var $this = this;
				var settings = $this.settings;
				var curr_url = window.location.href;
				if(curr_url != settings.base_url) {
					$this.skip_first = false;
					var slug = curr_url.substring(settings.base_url.length, window.location.href.length - 1);
					$(settings.container).each(function() {
						if($(this).data('slug') == slug) {
							$this.go_to = $(this).index();
							var nav_element = '.slide-circle:eq(' + $this.go_to + ')';
							if(!$(nav_element).hasClass('active')) {
								//unset the active element
								$(nav_element).parent().find('.active').removeClass('active');
								//make this element active
								$(nav_element).addClass('active');
								//unset the active slide
								$(settings.slideshow_class).find('.active').removeClass('active');
								//get the corresponding index
								$this.go_to = $(this).index();
								//move to slide
								$this.move_to();
							}
							$this.move_to();
							//exit the .each() loop
							return false;
						}
					});
				} else {
					if(!settings.skip_first) {
						$this.current = $(settings.container + ':first-child');
						$this.update_history();
					}
					$(settings.container + ':first-child').addClass('active');
					return false;
				}
			},

			//disable scroll
			disable_scroll : function() {
				var $this = this;
				//on window scroll
				$(window).scroll(function(e) {
					//don't do anything
					if (e.preventDefault) {
						e.preventDefault();
					}
					return false;
				});

				//stop ios touchmove events from messing things up
				$(document).on('touchmove', function(e) {
					//don't do anything
					if (e.preventDefault) {
						e.preventDefault();
					}
					return false;
				});
			},

			//bind keypresses
			enable_keys : function() {
				var $this = this;
				var settings = $this.settings;
				//on keypress
				$(document).keyup(function(e) {
					//prevent normal action
					if (e.preventDefault) {
						e.preventDefault();
					}
					//get keycode
					var key = e.which;
					console.log(key);
					//if we aren't currently scrolling
					if(!$this.scrolling) {
						$this.direction = '';
						//down arrow and page down keys
						if(key == 40 || key == 34) {
							//set direction to down
							$this.direction = 'd';
						//up arrow, and page up keys
						} else if(key == 38 || key == 33) {
							//set direction to up
							$this.direction = 'u';
						//home and end keys
						} else if(key == 36 || key ==35) {
							//don't scroll
							return false;
						}
						//if we are going horizontal, too
						if(settings.multi_dir) {
							//left arrow key
							if(key == 37) {
								//set direction to left
								$this.direction = 'l';
							//right arrow key
							} else if(key == 39) {
								//set direction to right
								$this.direction = 'r';
							}
						}
						//move the page
						$this.slide_it();
					}
					return false;
				});
			},

			//bind mousewheel
			enable_mousewheel : function() {
				var $this = this;
				//bind mousewheel to moving forward/backward
				$('body').bind('mousewheel', function(e, delta) {
					//don't perform default action
					if (e.preventDefault) {
						e.preventDefault();
					}
					//if we aren't supposed to skip the first scroll or we aren't on the first one
					if(!$this.settings.skip_first || $this.this_scroll > 0) {
						//if we aren't already scrolling
						if(!$this.scrolling) {
							//check to make sure that last_scroll and this_scroll aren't the same, unless they are 0 and this is the first scroll
							if($this.this_scroll === 0 || $this.last_scroll != $this.this_scroll) {
								//going up
								if(delta > 0) {
									//set direction
									$this.direction = 'u';
								//going down
								} else if(delta < 0) {
									//set direction
									$this.direction = 'd';
								}
								//slide accordingly
								$this.slide_it();
							//last_scroll and this_scroll are the same
							} else {
								//don't fire
								return false;
							}
							//increment last_scroll
							$this.last_scroll = $this.this_scroll;
						} else {
							return false;
						}
					//if we were supposed to skip it
					} else {
						$this.scrolling = true;
						var scroll_timeout = setTimeout(function() { $this.scrolling = false; }, 750);
						//increase the scroll counter
						$this.this_scroll++;
					}
					return false;
				});
			},

			//enable swipe events
			enable_swipe : function() {
				var $this = this;
				//bind swipe events for moving to the next item
				$('body').on('swipeup', function(e) {
					//don't do anything
					if (e.preventDefault) {
						e.preventDefault();
					}
					$this.direction = 'd';
					$this.slide_it();
					return false;
				});
				
				//bind swipe events for moving to the previous item
				$('body').on('swipedown', function(e) {
					//don't do anything
					if (e.preventDefault) {
						e.preventDefault();
					}
					$this.direction = 'u';
					$this.slide_it();
					return false;
				});
			},

			//add event to slide nav
			bind_nav : function() {
				var $this = this;
				//on nav click
				$('body').on('click', '.slide-circle', function(e) {
					//if they didn't click on the already active nav element
					if(!$(this).hasClass('active')) {
						//unset the active element
						$(this).parent().find('.active').removeClass('active');
						//make this element active
						$(this).addClass('active');
						//unset the active slide
						$('.slideshow').find('.active').removeClass('active');
						//get the corresponding index
						$this.go_to = $(this).index();
						//move to slide
						$this.move_to();
					} else {
						return false;
					}
				});
			},

			//move slideshow to given slide
			move_to : function() {
				var $this = this;
				var settings = $this.settings;
				var go_to = $('.project:eq(' + $this.go_to + ')');
				//make that slide active
				$this.cotainer = $this.go_to;
				if($this.slide === 0) {
					$this.top = true;
					$this.bottom = false;
				} else if($this.slide == $(settings.nav).find('.slide-circle').length - 1) {
					$this.bottom = true;
					$this.top = false;
				} else {
					$this.bottom = false;
					$this.bottom = false;
				}
				if(settings.container_before) {
					settings.container_before.call(this);
				}
				go_to.addClass('active');
				//scroll it
				$(settings.slideshow_class).stop(true,true).scrollTo(
					go_to, settings.scroll_time, {
						easing : settings.easing,
						onAfter : function() {
							var scroll_timeout = setTimeout(function() { $this.scrolling = false; }, settings.scroll_lockout);
						}
					}
				);
				$this.current = go_to;
				$this.update_history();
				if(settings.container_after) {
					settings.container_after.call(this);
				}
			},

			//bind history statechange event
			bind_statechange : function() {
				// Bind to StateChange Event
				History.Adapter.bind(window, 'statechange', function() {
					var State = History.getState();
					//History.log(State.data, State.title, State.url);
				});
			},

			/*------------------------------------------------------------------------------
			
				multi-directional-specific methods
			
			------------------------------------------------------------------------------*/

			//set up slides for multi-directional scrolling
			multi_directional : function() {
				var $this = this;
				var settings = $this.settings;
				//iterate through containers and find their slides
				$(settings.container).each(function() {
					var total_slides = $(this).find(settings.slides).length;
					$(this).data('slides',total_slides);
				});
				$this.bind_multi_dir_events();
			},

			//styles for multi-directional  slideshow
			multi_dir_css : function() {
				var $this = this;
				var settings = $this.settings;
				//stretch slides
				var new_width = $this.win_width - 20;
				$(settings.slides).css({
					width : new_width + 'px',
					height : $this.win_height + 'px',
					float : 'left'
				});
				$(settings.container).each(function() {
					var this_slides = $(this).data('slides');
					var this_width = $this.win_width * this_slides;
					$(settings.container).css({
						width : this_width + 'px',
						postition : 'relative',
						left : '0px',
						top : '0px'
					});
				});
			},

			//bind events for multi-directional slideshows
			bind_multi_dir_events : function() {
				var $this = this;
				var settings = $this.settings;
				if(settings.enable_swipe) {
					$this.bind_left_right_swipe();
				}
			},

			//set left/right swipe
			bind_left_right_swipe : function() {
				//bind swipe events for moving to the next item
				$('body').on('swipeleft', function(e) {
					//don't do anything
					if (e.preventDefault) {
						e.preventDefault();
					}
					$this.direction = 'l';
					$this.slide_it();
					return false;
				});
				
				//bind swipe events for moving to the previous item
				$('body').on('swiperight', function(e) {
					//don't do anything
					if (e.preventDefault) {
						e.preventDefault();
					}
					$this.direction = 'r';
					$this.slide_it();
					return false;
				});
			},

			//move it left and right
			slide_horizontal : function() {
				var $this = this;
				var settings = $this.settings;
				console.log('test');
				if($this.go_to) {
					var go_to = $this.go_to;
					//set index for desired element
					index = go_to.index();
					$this.slide = index;
					if(settings.slide_before) {
						settings.slide_before.call(this);
					}
					//switch active states on the nav
					$(settings.container + ':eq(' + $this.container + ')').find('.current').removeClass('current');
					$(settings.container + ':eq(' + $this.container + ')').find(settings.slides + ':eq(' + index + ')').addClass('current');
					//scroll
					$(settings.container).stop(true,true).scrollTo(
						go_to, settings.scroll_time, {
							easing : settings.easing
						}
					);
					//set history
					$this.current = go_to;
					$this.update_history();
					//if we aren't already on the active item
					if(!go_to.hasClass('active')) {
						$(settings.slideshow_class).find('.active').removeClass('active');
						go_to.addClass('active');
					}
					if(settings.container_after) {
						settings.container_after.call(this);
					}
				}
			}
		};

	})(jQuery);