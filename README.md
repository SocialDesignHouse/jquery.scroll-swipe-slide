jquery.scroll-swipe-slide
=========================

Scrolling, swiping slideshow plug-in for jQuery

Configuration Options
=====================

	use_scrollto : true,						//requires jQuery ScrollTo (this is included in the scripts folder)
	use_swipe : true,							//requires a swipe events plug-in (this can be toggled at any time) (jQuery++ Swipe Events with a custom swipe variation threshhold[for angled swipes] is included in the scripts folder)
	use_keypress : true,						//whether or not you want to use the arrow keys (this can be toggled at any time)
	use_history : false,						//requires History JS (this is included in the scripts folder)
	enable_scroll : false,						//if you want to use the scrollwheel (this can be toggled at any time)
	base_url : '',								//required if you want to use History JS
	base_title : '',							//the title that you want displayed in all of your History entries
	base_title_pos : 'after',					//whether you want the data-title attribute of the current slide to show before or after the base_title
	base_title_sep : ' | ',						//what you want displayed between the base_title and the data-title of the current slide (no spaces are included by default)
	multi_dir : false,							//true = slideshow uses vertical and horizontal movement
	go_to_next_container: false,				//true = scrolling to the left or right at the end of a container's slides moves to the next or previous container
	container : '.project',						//what class do your containers (containers move vertically and contain horizontally moving slides) have?
	container_before : '',						//callback function that runs BEFORE switching containers (sliding vertically)
	container_after : '',						//callback function that runs AFTER switching containers (sliding vertically)
	slides : '.slide',							//what class do your slides (slides move horizontally and are inside containers) have?
	slides_before : '',							//callback function that runs BEFORE switching slides (sliding horizontally)
	slides_after : '',							//callback function that runs AFTER switching slides (Sliding horizontally)
	center_nav : true,							//true = navigation circles for containers to be centered vertically within the window?
	nav : '.slide-nav',							//what class do you want your navigation have?
	nav_height : '10',							//what height do you want the nav circles to be
	slideshow_class : '.slideshow',				//what class does your overall slideshow have?
	easing : 'easeInOutExpo',					//easing for your slide transitions, requires easing plug-in (jquery.easing is included in the scrips folder)
	scroll_time : 1000,							//how long do you want the slide transitions to take? (if this is too short inertial scrolling on Apple Devices will mess up the slideshow)
	scroll_lockout : 20,						//this forces a slight delay between slides
	width : '100%',								//how wide is your slideshow?
	height : '100%',							//how tall is your slideshow?
	skip_first : false,							//true = ignore first transition (if you have a title screen and don't want it included in normal slideshow operations)
	callback : ''								//callback function that runs AFTER the slideshow has been initialized

Where it's used
===============

[The Body Adorned](http://exhibitions.snagmetalsmith.org/bodyadorned/) - v0.9 - Uses a vertical-only implementation and toggles the scroll, swipe, and slide when viewing artist statements and other elements that need to be scrollable without triggering the slideshow.
