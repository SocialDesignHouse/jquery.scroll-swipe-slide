jquery.scroll-swipe-slide.js v1.0.3 (beta)
===================================

Scrolling, swiping slideshow plug-in for jQuery


Notes
=====

Each slide and container will need specific data attributes:  `data-slug` will be appended to your URL on transitions and `data-title` will be added to the HTML document title on tranistions.

Each container will need an ID attribute (this dependency will be removed in a later version)

You must define a `base_url` for the slideshow to initialize.

There are several options that allow you to toggle the use of the arrow keys, mousewheel, and swiping if you have something like a lightbox that will need to be scrollable without advancing the slideshow:  `enable_scroll`, `use_keypress`, and `use_swipe`. When any of these are set to true, the slideshow will not respond to the toggled input. Set them to false to re-enable the slideshow for that input.

Several of the component dependencies will be eliminated in later versions, this is still an early build and these dependencies were used to speed up development time.


Vertical-only Slideshows
========================

For a slideshow with only vertical transitions:  you must include jQuery, jquery.scrollTo, History.js, and jquery.mousewheel for jquery.scroll-swipe-slide to function correctly


Multi-directional Slideshows
============================

For a slideshow with horizontal and vertical transitions:  you must include jQuery, jquery.scrollTo, TweenMax, History.js, and jquery.mousewheel for jquery.scroll-swipe-slide to function correctly


Optional Dependencies
=====================

Optionally, you may want to use the custom build of jquery++'s swipe events that has been included and jquery easing for the easing transition between slides.


Configuration Options
=====================

	use_history : true,							//REQUIRED History.js is included in the scripts folder
	base_url : '',								//REQUIRED the main url of your site/project
	use_scrollto : true,						//REQUIRED jquery.scrollTo is included in the scripts folder
	
	use_swipe : true,							//requires a swipe events plug-in (jQuery++ Swipe Events with swipe variation threshhold is included in the scripts folder)
	use_keypress : true,						//whether or not you want to use the arrow keys
	enable_scroll : false,						//if you want to use the scrollwheel
	
	base_title : document.title,				//the title that you want displayed in all of your History entries
	base_title_pos : 'after',					//whether you want the data-title attribute of the current slide to show before or after the base_title
	base_title_sep : ' | ',						//what you want displayed between the base_title and the data-title of the current slide (no spaces are included by default)
	
	slideshow_class : '.slideshow',				//what class does your overall slideshow have?
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
	
	v_easing : 'swing',							//easing for your container transitions, requires easing plug-in (this is included in the scrips folder)
	h_easing : Expo.easeInOut,					//easing for your slide transitions, uses TweenMax easing classes (http://api.greensock.com/js/)
	
	scroll_time : 1000,							//how long do you want the slide transitions to take?
	scroll_lockout : 20,						//this is needed due to inertial scrolling on Apple Devices
	
	width : '100%',								//how wide is your slideshow
	height : '100%',							//how tall is your slideshow
	
	skip_first : false,							//true = ignore first transition (if you have a title screen and don't want it included in normal slideshow operations)
	
	callback : ''								//callback function that runs AFTER the slideshow has been initialized


Where it's used
===============

+ [The Body Adorned](http://exhibitions.snagmetalsmith.org/bodyadorned/) - v0.9 - Uses a vertical-only implementation and toggles the scroll, swipe, and slide when viewing artist statements and other elements that need to be scrollable without triggering the slideshow.
+ [Demo](http://ericrallen.com/demo/scroll-swipe-slide/) - v1.0.2 - A quick demo to show the multi-directional capabilities of jq-scroll-swipe-slide. There will be an actual live site utilizing this functionality soon.

Bugs
====

It's a beta version, so there are bound to be a few bugs here and there. Feel free to submit an issue via github (https://github.com/SocialDesignHouse/jquery.scroll-swipe-slide/issues) with as much information as possible and I'll do my best to fix it.
