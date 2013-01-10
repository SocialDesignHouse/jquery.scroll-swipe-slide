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
 * @version		1.0
 * @deps		jQuery, jQuery Mousewheel, History JS
 * @optional	jQuery++ Swipe Events (custom build), jQuery Easing
 *				jQuery ScrollTo
 *
===================================================================*/

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
			use_scrollto : true,						//requires jQuery ScrollTo (this is included in the scripts folder)
			use_swipe : true,							//requires a swipe events plug-in (jQuery++ Swipe Events with swipe variation threshhold is included in the scripts folder)
			use_keypress : true,						//whether or not you want to use the arrow keys
			use_history : false,						//requires History JS (this is included in the scripts folder)
			enable_scroll : false,						//if you want to use the scrollwheel
			base_url : '',								//required if you want to use History JS
			base_title : '',							//the title that you want displayed in all of your History entries
			base_title_pos : 'after',					//whether you want the data-title attribute of the current slide to show before or after the base_title
			base_title_sep : ' | ',						//what you want displayed between the base_title and the data-title of the current slide (no spaces are included by default)
			multi_dir : false,							//true = slideshow uses vertical and horizontal movement
			go_to_next_container: false,				//true = scrolling to the left or right at the end of a container's slides moves to the next or previous container
			container : '.project',						//what class do your containers (the slides that move vertically and contain horizontally moving slides) have?
			container_before : '',						//callback function that runs BEFORE switching containers (sliding vertically)
			container_after : '',						//callback function that runs AFTER switching containers (sliding vertically)
			slides : '.slide',							//what class do your slides (the slides that move horizontally and are inside containers) have?
			slides_before : '',							//callback function that runs BEFORE switching slides (sliding horizontally)
			slides_after : '',							//callback function that runs AFTER switching slides (Sliding horizontally)
			center_nav : true,							//true = navigation circles for containers to be centered vertically within the window?
			nav : '.slide-nav',							//what class does your navigation have?
			nav_height : '10',							//what height do you want the nav circles to be
			slideshow_class : '.slideshow',				//what class does your overall slideshow have?
			easing : 'easeInOutExpo',					//easing for your slide transitions, requires easing plug-in (this is included in the scrips folder)
			scroll_time : 1000,							//how long do you want the slide transitions to take?
			scroll_lockout : 20,						//this is needed due to inertial scrolling on Apple Devices
			width : '100%',								//how wide is your slideshow
			height : '100%',							//how tall is your slideshow
			skip_first : false,							//true = ignore first transition (if you have a title screen and don't want it included in normal slideshow operations)
			callback : ''								//callback function that runs AFTER the slideshow has been initialized
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
				//$this.container = 0;
				//$this.slide = 0;

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

				//on load
				$(window).load(function() {
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
				if(settings.center_nav) {
					var nav_height = settings.nav_height * $(settings.nav).find('.slide-circle').length;
					var nav_pad = ($this.win_height - nav_height) / 2;
					$(settings.nav).css({
						'margin' : nav_pad + 'px 0'
					});
					if(settings.multi_dir) {
						$this.multi_dir_css();
					}
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
				var settings = $this.settings;
				//if we're using history and we are currently scrolling or swapping rows
				if($this.history && $this.scrolling || $this.history && $this.row_switch) {
					var $current = $this.current;
					var id = $current.attr('id');
					var state_data = $current.data();
					var title;
					//if there is a base title
					if(settings.base_title) {
						//if base title is supposed to come before everything
						if(settings.base_title_pos === 'before') {
							title = settings.base_title + settings.base_title_sep + $current.data('title');
						//if base title is supposed to come after everything
						} else if(settings.base_title_pos === 'after') {
							title = $current.data('title') + settings.base_title_sep + settings.base_title;
						//if base title position is not set
						} else {
							title = $current.data('title');
						}
					//if there is no base title
					} else {
						title = $current.data('title');
					}
					//set url from base_url and current container slug
					var url = settings.base_url + $current.data('slug');
					//if we're set up for multi directional slideshows
					if(settings.multi_dir) {
						var slide_url;
						//if we're on a container and switching rows
						if($this.type == 'container' && $this.row_switch) {
							$this.row_switch = false;
							//if there is an active slide set
							if($current.data('active-slide')) {
								slide_url = $current.find(settings.slides + ':eq(' + parseInt($current.data('active-slide'), 10) + ')').data('slug');
							//if there isn't
							} else {
								//check for slug
								if($current.find(settings.slides + ':eq(0)').data('slug')) {
									slide_url = $current.find(settings.slides + ':eq(0)').data('slug');
								//if there is no slug use a 1-indexed integer for the sub-url
								} else {
									slide_url = 1;
								}
							}
						//if we're not
						} else {
							//if this slide has a slug
							if($current.find(settings.slides + ':eq(' + $this.slide + ')').data('slug')) {
								slide_url = $current.find(settings.slides + ':eq(' + $this.slide + ')').data('slug');
							} else {
								slide_url = $this.slide + 1;
							}
						}
						//add sub url to url
						url += '/' + slide_url;
					}
					//set up state object
					var state_obj = {
						id : id,
						atts : state_data,
						type : $this.type,
						container : $this.container,
						slide : $this.slide,
						direction : $this.direction
					};
					//update history
					History.pushState(state_obj, title, url);
				//if we're not using history or not moving
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
					//check for trailing slash and remove it
					if(slug.charAt(slug.length - 1) == '/') {
						slug = slug.slice(0, -1);
					}
					$(settings.container).each(function() {
						if($(this).data('slug') == slug) {
							$this.go_to = $(this).index();
							$this.container = $(this).index();
							//move to slide
							$this.switch_nav($this.go_to);
							//exit the .each() loop
							return false;
						}
					});
					return true;
				} else {
					$this.current = $(settings.container + ':first-child');
					$this.container = 0;
					$this.slide = 0;
					if(!settings.skip_first) {
						$this.update_history();
					}
					$(settings.container + ':first-child').addClass('active');
					$(settings.container + ':first-child').find(settings.slides + ':first-child').addClass('current');
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
				$(document).keydown(function(e) {
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
				$('body').on('click', '.slide-circle', function() {
					$this.scrolling = true;
					var that = $(this).index();
					if(that > $('.slide-circle.active').index()) {
						$this.direction = 'd';
					} else if(that < $('.slide-circle.active').index()) {
						$this.direction = 'u';
					}
					$this.go_to = that;
					$this.type = 'container';
					$this.current = $(settings.container + ':eq(' + that + ')');
					if($this.current.data('active-slide')) {
						$this.slide = $this.current.data('active-slide');
					} else {
						$this.slide = 0;
					}
					$this.update_history();
				});
			},

			//get next item
			get_next : function() {
				var $this = this;
				var settings = $this.settings;
				$this.container = $(settings.slideshow_class).find('.active').index();
				//make sure a direction has been set
				if($this.direction) {
					var dir = $this.direction;
					//going up
					if(dir === 'u') {
						//if there is a previous item
						if($(settings.slideshow_class).find('.active').prev(settings.container).length) {
							$this.scrolling = true;
							$this.current = $(settings.slideshow_class).find('.active').prev(settings.container);
							if($this.current.data('active-slide')) {
								$this.slide = $this.current.data('active-slide');
							} else {
								$this.slide = 0;
							}
							$this.type = 'container';
							$this.go_to = $this.current.index();
						//if there isn't
						} else {
							$this.scrolling = false;
						}
					//going down
					} else if(dir === 'd') {
						//if there is a next item
						if($(settings.slideshow_class).find('.active').next(settings.container).length) {
							$this.scrolling = true;
							$this.current = $(settings.slideshow_class).find('.active').next(settings.container);
							if($this.current.data('active-slide')) {
								$this.slide = $this.current.data('active-slide');
							} else {
								$this.slide = 0;
							}
							$this.type = 'container';
							$this.go_to = $this.current.index();
						//if there isn't
						} else {
							$this.scrolling = false;
						}
					//going left
					} else if(dir === 'l' && settings.multi_dir) {
						//if there is a next item
						if($(settings.container + ':eq(' + $this.container + ')').find('.current').prev(settings.slides).length) {
							$this.scrolling = true;
							$this.type = 'slide';
							$this.go_to = $(settings.container + ':eq(' + $this.container + ')').find('.current').prev(settings.slides).index();
							$this.slide = $this.go_to;
						//if there isn't
						} else {
							//if we're set to go to the next container
							if(settings.go_to_next_container && $(settings.container + ':eq(' + $this.container + ')').prev(settings.container).length) {
								$this.row_switch = true;
								$this.current = $(settings.container + ':eq(' + $this.container + ')').prev(settings.container);
								$this.slide = $this.current.data('active-slide');
								$this.type = 'container';
								$this.go_to = $this.current.index();
								$this.direction = 'u';
							//if we aren't
							} else {
								$this.scrolling = false;
							}
						}
					//going right
					} else if(dir === 'r' && settings.multi_dir) {
						//if there is a next item
						if($(settings.container + ':eq(' + $this.container + ')').find('.current').next(settings.slides).length) {
							$this.scrolling = true;
							$this.type = 'slide';
							$this.go_to = $(settings.container + ':eq(' + $this.container + ')').find('.current').next(settings.slides).index();
							$this.slide = $this.go_to;
						//if there isn't
						} else {
							//if we're set to go to the next container
							if(settings.go_to_next_container && $(settings.container + ':eq(' + $this.container + ')').next(settings.container).length) {
								$this.row_switch = true;
								$this.current = $(settings.container + ':eq(' + $this.container + ')').next(settings.container);
								$this.slide = $this.current.data('active-slide');
								$this.type = 'container';
								$this.go_to = $this.current.index();
								$this.direction = 'd';
							//if we aren't
							} else {
								$this.scrolling = false;
							}
						}
					}
					//update history
					$this.update_history();
				//if there wasn't a direction
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

			//move slideshow to given container
			move_to : function() {
				var $this = this;
				var settings = $this.settings;
				var go_to_this = $(settings.container + ':eq(' + $this.go_to + ')');
				//unset the active slide
				$(settings.slideshow_class).find('.active').removeClass('active');
				//make that slide active
				$this.container = $this.go_to;
				if(settings.container_before) {
					settings.container_before.call(this);
				}
				go_to_this.addClass('active');
				if(!go_to_this.find('.current').length) {
					go_to_this.find(settings.slides + ':first-child').addClass('current');
				}
				go_to_this.data('active-slide', go_to_this.find('.current').index());
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
			},

			//bind history statechange event
			bind_statechange : function() {
				var $this = this;
				var settings = $this.settings;
				// Bind to StateChange Event
				History.Adapter.bind(window, 'statechange', function() {
					var State = History.getState();
					//History.log(State.data, State.title, State.url);
					var url = State.url;
					//if there is a trailing slash, remove it
					if(url.substr(-1) == '/') {
						url = url.substr(0, url.length - 1);
					}
					//get base length
					var base_length = settings.base_url.length;
					//remove base from url
					var slug = url.substr(base_length);
					var con_slug = '';
					var slide_slug = '';
					$this.container = State.data.container;
					$this.slide = State.data.slide;
					//if it's multi-directional
					if(settings.multi_dir) {
						//find the slide and container slugs
						var slash_pos = slug.lastIndexOf('/');
						//container slug is the everything before the last slash
						con_slug = slug.substr(0, slash_pos);
						//slide slug is everything after the last slash
						slide_slug = slug.substr(slash_pos + 1);
					}
					//find the index of the container we need
					var found = false;
					$(settings.container).each(function() {
						var go_to;
						//if we are multi-directional
						if(con_slug.length && settings.multi_dir) {
							if($(this).data('slug') == con_slug) {
								go_to = $(this).index();
								$this.go_to = go_to;
								$this.container = go_to;
								$this.switch_nav(go_to);
								found = false;
								//exit the .each() loop
								return false;
							}
						//if we aren't
						} else {
							if($(this).data('slug') == slug) {
								go_to = $(this).index();
								$this.go_to = go_to;
								$this.container = go_to;
								$this.switch_nav(go_to);
								found = true;
								//exit the .each() loop
								return false;
							}
						}
					});

					//if we still need to find a slug match in a slide
					if(settings.multi_dir && !found) {
						if($('#' + State.data.id).hasClass('active')) {
							var check_index = $('#' + State.data.id).find('.current').index();
							if($this.slide > check_index && check_index <= $(settings.container + ':eq(' + $this.container + ')').data('slides')) {
								$this.direction = 'r';
							} else if($this.slide < check_index && check_index >= 0) {
								$this.direction = 'l';
							}
						}
						var slide_index;
						//find the slide slug
						var found_s = false;
						$(settings.container + ':eq(' + $this.container + ')').find(settings.slides).each(function() {
							if($(this).data('slug') == slide_slug) {
								slide_index = $(this).index();
								found_s = true;
								return false;
							}
						});
						if(!found_s) {
							$(settings.container + ':eq(' + $this.container + ')').find(settings.slides).each(function() {
								if($(this).index() + 1 == slide_slug) {
									slide_index = $(this).index();
									found_s = true;
									return false;
								}
							});
						}
						//get the actual index of the slide from the slug by subtracting 1
						$this.go_to = parseInt(slide_index, 10);
						if($this.go_to != $(settings.container + ':eq(' + $this.container + ')').data('active-slide')) {
							$this.slide_horizontal();
						}
					}
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
				if(typeof $this.go_to !== 'undefined') {
					var move = '';
					var go_to;
					//set index for desired element
					if(typeof $this.go_to !== 'number') {
						$this.slide = $this.go_to.index();
						go_to = $this.go_to;
					} else {
						$this.slide = $this.go_to;
						go_to = $(settings.container + ':eq(' + $this.container +')').find(settings.slides + ':eq(' + $this.go_to + ')');
					}
					if(settings.slides_before) {
						settings.slides_before.call(this);
					}
					go_to.siblings().each(function() {
						if($(this).hasClass('current')) {
							$(this).removeClass('current');
						}
					});
					go_to.parent().data('active-slide', $this.slide);
					var left = $(settings.container + ':eq(' + $this.container + ')').offset().left;
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
								var scroll_timeout = setTimeout(function() { $this.scrolling = false; }, settings.scroll_lockout);
							}
						}
					);
					go_to.addClass('current');
					if(settings.slides_after) {
						settings.slides_after.call(this);
					}
					//reset directon
					$this.direction = '';
				}
			}
		};

	})(jQuery);