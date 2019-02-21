/*
fixedDiv.js

Copyright (c) 2010 iRacing.com Motorsport Simulations, LLC.   All Rights Reserved.

@author David Hout
*/

function FixedDiv(id, styles) {
	var that = this;
	this.hasFocus = false;
	this.id = id;
	
	var css = {};
	for (var prop in styles) {
		css[prop] = styles[prop];
	}
	var div = element("div", {id:id, className:"fixedDiv"}, css);
	div.onmouseover = function() {
		that.hasFocus = true;
	}
	div.onmouseout = function() {
		that.hasFocus = false;
	}
	document.body.appendChild(div);
	return div;
}

