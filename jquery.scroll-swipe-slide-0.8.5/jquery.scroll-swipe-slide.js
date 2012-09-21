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
 * @version		0.8.5
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
				//extend settings based on the defined defaults and what was provided in the class declaration
				settings = $.extend({}, $.fn.scrollSwipeSlide.default_settings, settings || {});
				//what to do with each instance of the selector passed to the class
				return this.each(function() {
				//save $(this) and settings to variables for quicker referencing
				var elem = $(this);
				var $settings = jQuery.extend(true,{},settings);
				//initialize class
				var scrollswipeslide = new scrollSwipeSlide($settings);
				//save the element to the object
				scrollswipeslide.scrollswipeslide = elem;
				//initialize the object
				scrollswipeslide.initialize();
				//save information to data attribute on the element
				elem.data('_scrollSwipeSlide', scrollswipeslide);
			});
			//if scrollSwipeSlide was called with an option name
			} else if(typeof option === 'string') {
				//check for method parameters first
				switch(option) {
					case 'next_slide' :
						//not yet
						break;
					case 'prev_slide' :
						//not yet
						break;
					case 'next_con' :
						//not yet
						break;
					case 'prev_con' :
						//not yet
						break;
					default :
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
			//if we're sent a  slide index we want to move to it
			} else if(typeof option === 'number') {
				var index = option;
				//check for instance
				var instance = this.data('_scrollSwipeSlide');
				//if no options were found, we can't do anything
				if(!instance) {
					return false;
				} else {
					instance.go_to = index;
					instance.switch_nav(index);
				}
			}
		};

		//set up default options
		$.fn.scrollSwipeSlide.default_settings = {
			use_scrollto : true, //requires jQuery ScrollTo (this is included in the scripts folder)
			use_swipe : true, //requires a swipe events plug-in (jQuery++ Swipe Events with swipe variation threshhold is included in the scripts folder)
			use_keypress : true,
			use_history : false, //requires History JS (this is included in the scripts folder)
			enable_scroll : false,
			base_url : '', //required if you want to use History JS
			//true = slideshows to use vertical and horizontal movement
			multi_dir : false,
			//true = when scrolling to the left and right at the end of a container's slides, move to the next or previous container
			go_to_next_container: false,
			container : '.project',
			//runs before switching containers
			container_before : '',
			//runs after switching containers
			container_after : '',
			slides : '.slide',
			//runs before switching slides
			slides_before : '',
			//runs after switching slides
			slides_after : '',
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
			//runs after initializing the slideshow
			callback : ''
		};

		//add settings to object
		function scrollSwipeSlide(settings) {
			this.scrollswipeslide = null;
			this.settings = settings;
			return this;
		}

		/*------------------------------------------------------------------------------
		
			Plug-in Methods
		
		------------------------------------------------------------------------------*/

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
				if(settings.callback) {
					settings.callback.call(this);
				}
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
					$(settings.container).css({
						'width' : $this.win_width + 'px'
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
					nav += '<li class="slide-circle' + add_class + '"><a href="javascript:void(0);"></a></li>';
				}
				var which_con = settings.container + ':first-child';
				$(which_con).addClass('active');
				$(which_con).find(settings.slides + ':first-child').addClass('current');
				nav += '</ul>' +
				'</nav>';
				$this.scrollswipeslide.prepend(nav);
			},

			//update browser history
			update_history : function() {
				var $this = this;
				if($this.history) {
					var $current = $this.current;
					var id = $current.attr('id');
					var title = $current.data('title');
					var url = settings.base_url + $current.data('slug');
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
								$this.container = $(this).index();
								$this.go_to = $(this).index();
							}
							//move to slide
							$this.switch_nav($this.go_to);
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
				var settings = $this.settings;
				//on window scroll
				$(window).scroll(function(e) {
					//check if enable_scroll has been toggled by the user
					if(!settings.enable_scroll) {
						//don't do anything
						if (e.preventDefault) {
							e.preventDefault();
						}
						return false;
					}
				});

				//stop ios touchmove events from messing things up
				$(document).on('touchmove', function(e) {
					//check if enable_scroll has been toggled by the user
					if(!settings.enable_scroll) {
						//don't do anything
						if (e.preventDefault) {
							e.preventDefault();
						}
						return false;
					}
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
					//in case the user has toggled the use_keys option, we need to check again
					if(settings.use_keypress) {
						//get keycode
						var key = e.which;
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
							//if we are going both directions and hit left arrow key
							} else if(settings.multi_dir && key == 37) {
								//set direction to left
								$this.direction = 'l';
							//if we are going both directions and hit right arrow key
							} else if(settings.multi_dir && key == 39) {
								//set direction to right
								$this.direction = 'r';
							}
							//move the page
							//$this.slide_it();
							$this.get_next();
						}
					}
					return false;
				});
			},

			//bind mousewheel
			enable_mousewheel : function() {
				var $this = this;
				var settings = $this.settings;
				//bind mousewheel to moving forward/backward
				$('body').bind('mousewheel', function(e, delta) {
					//if the user has toggled scrolling, we need to check for it again
					if(!settings.enable_scroll) {
						//don't perform default action
						if (e.preventDefault) {
							e.preventDefault();
						}
						//if we aren't supposed to skip the first scroll or we aren't on the first one
						if(!$this.settings.skip_first || $this.this_scroll > 0) {
							//if we aren't already scrolling
							if(!$this.scrolling) {
								$this.this_scroll++;
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
									//$this.slide_it();
									$this.get_next();
								}
								//increment last_scroll
								$this.last_scroll = $this.this_scroll;
							}
						//if we were supposed to skip it
						} else {
							$this.scrolling = true;
							var scroll_timeout = setTimeout(function() { $this.scrolling = false; }, 750);
							//increase the scroll counter
							$this.this_scroll++;
						}
					}
				});
			},

			//enable swipe events
			enable_swipe : function() {
				var $this = this;
				settings = $this.settings;
				//bind swipe events for moving to the next item
				$('body').on('swipeup', function(e) {
					//in case the user has toggled the use_swipe option, we need to check for it again
					if(settings.use_swipe) {
						//don't do anything
						if (e.preventDefault) {
							e.preventDefault();
						}
						$this.direction = 'd';
						$this.get_next();
						//$this.slide_it();
						return false;
					}
				//bind swipe events for moving to the previous item
				}).on('swipedown', function(e) {
					//in case the user has toggled the use_swipe option, we need to check for it again
					if(settings.use_swipe) {
						//don't do anything
						if (e.preventDefault) {
							e.preventDefault();
						}
						$this.direction = 'u';
						$this.get_next();
						//$this.slide_it();
						return false;
					}
				});
				if(settings.multi_dir) {
					//bind swipe events for moving to the next item
					$('body').on('swipeleft', function(e) {
						//in case the user has toggled the use_swipe option or multi_dir option, we need to check them again
						if(settings.use_swipe && settings.multi_dir) {
							//don't do anything
							if (e.preventDefault) {
								e.preventDefault();
							}
							$this.direction = 'r';
							$this.get_next();
							//$this.slide_it();
							return false;
						}
					//bind swipe events for moving to the previous item
					}).on('swiperight', function(e) {
						//in case the user has toggled the use_swipe option or multi_dir option, we need to check them again
						if(settings.use_swipe && settings.multi_dir) {
							//don't do anything
							if (e.preventDefault) {
								e.preventDefault();
							}
							$this.direction = 'l';
							$this.get_next();
							//$this.slide_it();
							return false;
						}
					});
				}
			},

			//add event to slide nav
			bind_nav : function() {
				var $this = this;
				var settings = $this.settings;
				//on nav click
				$('body').on('click', '.slide-circle', function(e) {
					var that = $(this).index();
					$this.go_to = that;
					$this.current = $(settings.container + ':eq(' + that + ')');
					$this.update_history();
				});
			},

			//get next item
			get_next : function() {
				var $this = this;
				var settings = $this.settings;
				if($this.direction) {
					var dir = $this.direction;
					if(dir === 'u') {
						//if there is a previous item
						if($(settings.slideshow_class).find('.active').prev(settings.container).length > 0) {
							$this.scrolling = true;
							$this.current = $(settings.slideshow_class).find('.active').prev(settings.container);
							$this.go_to = $this.current.index();
						} else {
							$this.scrolling = false;
						}
					} else if(dir === 'd') {
						//if there is a next item
						if($(settings.slideshow_class).find('.active').next(settings.container).length > 0) {
							$this.scrolling = true;
							$this.current = $(settings.slideshow_class).find('.active').next(settings.container);
							$this.go_to = $this.current.index();
						} else {
							$this.scrolling = false;
						}
					} else if(dir === 'l' && settings.multi_dir) {
						//if there is a next item
						if($(settings.container + ':eq(' + $this.container + ')').find('.current').prev(settings.slides).length > 0) {
							$this.scrolling = true;
							$this.go_to = $(settings.container + ':eq(' + $this.container + ')').find('.current').prev(settings.slides);
							$this.slide_horizontal();
						} else {
							if(settings.go_to_next_container && $(settings.container + ':eq(' + $this.container + ')').prev(settings.container).length > 0) {
								$this.current = $(settings.container + ':eq(' + $this.container + ')').prev(settings.container);
								$this.go_to = $this.current.index();
								$this.direction = 'u';
							} else {
								$this.scrolling = false;
							}
						}
					} else if(dir === 'r' && settings.multi_dir) {
						//if there is a next item
						if($(settings.container + ':eq(' + $this.container + ')').find('.current').next(settings.slides).length > 0) {
							$this.scrolling = true;
							$this.go_to = $(settings.container + ':eq(' + $this.container + ')').find('.current').next(settings.slides);
							$this.slide_horizontal();
						} else {
							if(settings.go_to_next_container && $(settings.container + ':eq(' + $this.container + ')').next(settings.container).length > 0) {
								$this.current = $(settings.container + ':eq(' + $this.container + ')').next(settings.container);
								$this.go_to = $this.current.index();
								$this.direction = 'd';
							} else {
								$this.scrolling = false;
							}
						}
					}
					$this.update_history();
				} else {
					return false;
				}
			},

			//switch active state on nav
			switch_nav : function (that) {
				var $this = this;
				var settings = $this.settings;
				var elem = $(settings.nav).find('.slide-circle:eq(' + that + ')');
				//if they didn't click on the already active nav element
				if(!elem.hasClass('active')) {
					//unset the active element
					elem.parent().find('.active').removeClass('active');
					//make this element active
					elem.addClass('active');
					//get element
					$this.current = $(settings.container + ':eq(' + that + ')');
					$this.move_to();
				} else {
					return false;
				}
			},

			//move slideshow to given slide
			move_to : function() {
				var $this = this;
				var settings = $this.settings;
				//if($this.direction === 'u' || $this.direction === 'd') {
					var go_to_this = $(settings.container + ':eq(' + $this.go_to + ')');
					//unset the active slide
					$(settings.slideshow_class).find('.active').removeClass('active');
					//make that slide active
					$this.container = $this.go_to;
					if(settings.container_before) {
						settings.container_before.call(this);
					}
					go_to_this.addClass('active');
					go_to_this.find(settings.slides + ':first-child').addClass('current');
					//scroll it
					$(settings.slideshow_class).stop(true,true).scrollTo(
						go_to_this, settings.scroll_time, {
							easing : settings.easing,
							onAfter : function() {
								var scroll_timeout = setTimeout(function() { $this.scrolling = false; }, settings.scroll_lockout);
							}
						}
					);
					$this.current = go_to_this;
					//$this.update_history();
					if(settings.container_after) {
						settings.container_after.call(this);
					}
					//reset direction
					$this.direction = '';
				//}
			},

			//bind history statechange event
			bind_statechange : function() {
				var $this = this;
				var settings = $this.settings;
				// Bind to StateChange Event
				History.Adapter.bind(window, 'statechange', function() {
					var State = History.getState();
					//get path
					var url = document.URL;
					//if there is a trailing slash, remove it
					if(url.substr(-1) == '/') {
						url = url.substr(0, url.length - 1);
					}
					//get base length
					var base_length = settings.base_url.length;
					//remove base from url
					var slug = url.substr(base_length);
					//find the index of the container we need
					$(settings.container).each(function() {
						if($(this).data('slug') == slug) {
							var go_to = $(this).index();
							$this.go_to = go_to;
							$this.switch_nav(go_to);
							//exit the .each() loop
							return false;
						}
					});
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
			},

			//styles for multi-directional  slideshow
			multi_dir_css : function() {
				var $this = this;
				var settings = $this.settings;
				//stretch slides
				$(settings.slides).css({
					'width' : $this.win_width + 'px',
					'height' : $this.win_height + 'px',
					'float' : 'left'
				});
				$(settings.container).each(function() {
					var this_slides = $(this).data('slides');
					var this_width = $this.win_width * this_slides;
					$(this).css({
						'width' : this_width + 'px',
						'position' : 'relative',
						'left' : '0px',
						'top' : '0px'
					});
				});
			},

			//move it left and right
			slide_horizontal : function() {
				var $this = this;
				var settings = $this.settings;
				if($this.go_to) {
					var move = '';
					var go_to = $this.go_to;
					//set index for desired element
					$this.slide = go_to.index();
					if(settings.slides_before) {
						settings.slides_before.call(this);
					}
					//switch active states on the nav
						//switch thumbnail active state here
					//scroll
					//$(settings.container + ':eq(' + $this.container + ')').stop(true,true).
					var left = $(settings.container + ':eq(' + $this.container + ')').offset().left;
					//var left = $this.win_width * $this.slide;
					if(left != '0px') {
						if($this.direction == 'r') {
							move = left - $this.win_width;
						} else if($this.direction == 'l') {
							move = left + $this.win_width;
						}
					} else {
						move = 0;
					}
					TweenMax.to(
						$(settings.container + ':eq(' + $this.container + ')'), 0.8, {
							css : {
								'left' : move + 'px'
							},
							ease : Expo.easeInOut,
							onComplete : function() {
								scroll_timeout = setTimeout(function() { $this.scrolling = false; }, settings.scroll_lockout);
							}
						}
					);
					//if we aren't already on the active item
					if(!go_to.hasClass('current')) {
						$(settings.container + ':eq(' + $this.container + ')').find('.current').removeClass('current');
						$(settings.container + ':eq(' + $this.container + ')').find(settings.slides + ':eq(' + $this.slide + ')').addClass('current');
					}
					if(settings.slides_after) {
						settings.slides_after.call(this);
					}
					//reset directon
					$this.direction = '';
				}
			}
		};

	})(jQuery);