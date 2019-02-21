/*
 * This object provides a general purpose popup mechanism to slowly replace some of our 
 * existing overly complicated popups.  The goal is to be able to easily attach
 * a popup to a target element on a page.  The popup can have arbitrary content and
 * can be automatically positioned relative to the target element.  The popup will
 * be displayed when the user mouses over the target element.  The user can mouse
 * between the target element and the popup without losing the popup.  The popup will
 * not disappear until the user's mouse is not over either the target or the popup
 * for a configurable length of time.
 * 
 * Only one popup can be visible on the page at any time.  This component doesn't support
 * nested popups.
 * 
 * Once the popup is created it will present itself and go away automatically based on mouse
 * events.  With the most common use case all of the functionality is determined by the 
 * parameters passed to the constructor.
 * 
 * IRPopup(targetElement, popupParms, builderFunc)
 * 
 * targetElement - the element on the page that will be associated with the popup.  The object will
 * 				coordinate mouse events between this element and the popup itself and the popup will
 * 				be positioned relative to the element.
 * popupParms - an object containing optional parameters.  If you don't want to override any of the defaults
 * 			you should pass {}.  The options are:
 * 		orientation - can be top, bottom, left or right.  This defaults to top
 * 		zIndex - defaults to 10
 * 		popupId - defaults to "irpopup"
 * 		offsetX - the popup will be shifted this many pixels horizontally when it is positioned
 * 		offsetY - the popup will be shifted this many pixels vertically when it is positioned
 * 		cssClass - the css class that will be applied to the top level popup div.  Defaults to irPopup.
 * 		gestureType - defaults to "mouseover" - can also be "click" - this determines how the popup is opened.  With mouseover it will open and
 * 						close automatically based on mouseover events on the target and/or popup.  With click it will open on click of the target.
 * 		timeoutMS - how long we will wait after a mouseout before we close the popup.  This defaults to 200.  You may want
 * 						to increase it if you see the popup closing unexpectedly when mousing between the target and the
 * 						popup.  You may want to decrease it if you feel the popup is staying open too long after mousing out.
 * 		clientData - defaults to empty object.  If provided it will be attached to the div that is passed into the build function.  This is a way for the caller
 * 						to pass data through to the builder.
 * 		onBeforeShow - optional callback function that is called prior to showing the popup.  This can be used to build the popup's content on click or mouseover rather
 * 						than on page load
 * 		disableFade	- defaults to false.  If true we will disable the query fade in / out effects
 * 		variableSize - defaults to false.  If true will will handle positioning slightly different
 * 
 * builderFunc - a function that will be called by the popup to allow you to create the popup's content.  Your function should have
 * 						a single parameter that will be called with the div that you should append your content to.
 *  
 * An example of how to use this component follows:
 * 
 * var popupParms = {};
 * popupParms.orientation = "top";
 * popupParms.offsetY = 5;
 * var myPopup = new IRPopup(targetDiv, popupParms, function(container) {
 *	   container.appendChild(element("div", 
 *								{innerHTML:"here is your popup"}, 
 *								{border:"1px solid black", width:"200px", backgroundColor:"white"}));
 * });
 * 
 * Additional public methods:
 * 	rebuild - this will remove the popups content and call build() and position() again
 *  position - this will position the popup.  You would want to call this if you altered the contents of the popup after it was
 *  			constructed in such a way that the dimensions of the popup change.
 *  remove - removes the popup from the dom
 * 	setOnBeforeShowHandler - configures a callback that will be called prior to showing the popup.  This can be used to update content if necessary.
 * 	getPopupId - returns dom id of the popup's main div
 * 	hide - hides the popup
 *  show - shows the popup
 *  
 * 
 */
var IRPopup = function(target, parms) {
	/**
	 * Private variables
	 */
	var target = target;
	var builderFunc = null;

	/**
	 * Constructor initialization
	 */
	var orientation = (parms.orientation ? parms.orientation : "top");
	var zIndex = (parms.zIndex ? parms.zIndex : 10);
	var popupId = (parms.popupId ? parms.popupId : "irPopup");
	var offsetX = (parms.offsetX ? parms.offsetX : 0);	
	var offsetY = (parms.offsetY ? parms.offsetY : 0);
	var timeoutMS = (parms.timeoutMS ? parms.timeoutMS : 200);
	var cssClass = (parms.cssClass ? parms.cssClass : "irPopup");
	var gestureType = (parms.gestureType ? parms.gestureType : "mouseover");
	var clientData = (parms.clientData ? parms.clientData : {});
	var disableFade = (parms.disableFade ? parms.disableFade : false);
	var variableSize = (parms.variableSize ? parms.variableSize : false);
	
	var onBeforeShow = function(container) {
		logToConsole("onBeforeShow has not been overridden");
	}
	
	var container = null;
	
	var _position = function() {
		logToConsole("> position popupId = " + popupId);
		
		/**
		 * Switching to jquery's offset() b/c it takes scrollbars into account when calculating position in window
		 */
		var offsets = $(target).offset();
		//var offsets = getOffsets(target);
		var targetWidth = $(target).width();
		var targetHeight = $(target).height();
		var popupWidth = $(container).width();
		var popupHeight = $(container).height();
		
		logToConsole("targetWidth = " + targetWidth);
		logToConsole("targetHeight = " + targetHeight);
		logToConsole("targetTop = " + offsets.top);
		logToConsole("targetLeft = " + offsets.left);
		logToConsole("popupWidth = " + popupWidth);
		logToConsole("popupHeight = " + popupHeight);

		var left;
		var top;
		if (orientation == "top") {
			left = offsets.left - (popupWidth / 2) + (targetWidth / 2);
			top = offsets.top - popupHeight;
		}
		if (orientation == "left") {
			left = offsets.left - popupWidth;
			top = offsets.top - (popupHeight / 2) + (targetHeight / 2);		
		}
		if (orientation == "right") {
			left = offsets.left + targetWidth;
			top = offsets.top - (popupHeight / 2) + (targetHeight / 2);		
		}
		if (orientation == "bottom") {
			left = offsets.left - (popupWidth / 2) + (targetWidth / 2);
			top = offsets.top + targetHeight;		
		}
		//logToConsole("new left = " + left);
		//logToConsole("new top = " + top);
		left += offsetX;
		top += offsetY;
		//logToConsole("adjusted new left = " + left);
		//logToConsole("adjusted new top = " + top);
		container.style.left = left + "px";
		container.style.top = top + "px";
		
		//logToConsole("< position");

	}
	
	/**
	 * Private methods
	 */
	var timeoutId = 0;
	var _show = function() {
		clearTimeout(timeoutId);
		onBeforeShow(container); 				
		container.style.visibility = "visible";
		
		if (disableFade) {
			container.style.opacity = "1";
			_position();
			return;
		}
		
		$('#'+container.id+'').stop().fadeTo(400,'0.85', function() {
			_position();
		});
		
		/**
		 * We need this to make positioning of popups quick on the league page but it seems to break the
		 * positioning of popups on the event results popup.  I think it has something to do with the fact
		 * that the event results popup has a variable width.  I think I need to look closer at when
		 * we call position relative to when we create the content.
		 */
		if (!variableSize) {
			_position();
		}
		
	}
	var _focus = function() {
		clearTimeout(timeoutId);
		if (!disableFade) {
			$('#'+container.id+'').stop().fadeTo(400,'1');
		}
	}
	var _hide = function(now) {
		if (now) {
			container.style.visibility = "hidden";
			return;			
		}
		
		timeoutId = setTimeout(function() {
			if (!disableFade) {
				$('#'+container.id+'').stop().fadeTo(400,'0', function() {
					container.style.visibility = "hidden";	
				});
			}
			else {
				container.style.visibility = "hidden";				
			}
								
		}, timeoutMS);
	}
	var _isShown = function() {
		return (container.style.visibility == "visible");
	}
	
	/**
	 * Setup event handlers.  The basic idea here is we will monitor mouseover and mouseout
	 * events for both the target (the div the popup is associated with) and the popup
	 * itself.  Whenever we get a mouseout of either the target or popup we will schedule
	 * a close of the popup.  Whenever we get a mouseover of either the target or popup we
	 * will cancel any scheduled close and show the popup.  This simple mechanism allows us
	 * to mouse between the target and popup without having it close on us.  This will generally
	 * work even if the target and popup have some empty space between them with the caveat that
	 * if the user needs to move the mouse from one element to the other in less time than
	 * the configured timeout.  The default timeout is 200ms but this can be overridden
	 * in the parms argument.
	 */
	var _setupEventHandlers = function() {
		if (gestureType == "mouseover") {
			$(target).mouseover(function() {
				_show();
			});
			$(target).mouseout(function() {
				_hide();
			});
			$(container).mouseover(function() {
				_focus();
			});
			$(container).mouseout(function() {
				_hide();
			});
		}
		else if (gestureType == "click") {
			$(target).click(function() {
				if (_isShown()) {
					_hide(true);
				}
				else {
					_show();
				}
			});			
		}
		
	}

	/**
	 * Return the public interface
	 */
	return {
		build:function(builder) {
			var visibility = "hidden";
			container = document.body.appendChild(element("div",{id:popupId, className:cssClass},
					{visibility:visibility, position:"absolute", top:"0px", left:"0px", zIndex:zIndex}));
			container.clientData = clientData;			
			builderFunc = builder;
			builderFunc(container);	
			_setupEventHandlers();
			_position();
		},
		rebuild:function() {
			removeAllChildren(container);
			build();
			_position();
		},
		position:function() {
			_position();
		},
		remove:function() {
			$(container).remove();
		},
		setOnBeforeShowHandler:function(callback) {
			onBeforeShow = callback;
		},
		getPopupId:function() {
			return popupId;
		},
		hide:function(hideNow) {
			_hide(hideNow);
		},
		show:function() {
			_show();
		}
		
	}	
}




