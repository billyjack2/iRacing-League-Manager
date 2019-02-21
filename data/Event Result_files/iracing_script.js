/*

iracing_script.js

Copyright (c) 2007 iRacing.com Motorsport Simulations, LLC.   All Rights Reserved.

@author Amy Winter/Scott Nash 
*/


// iracing_script.js
/******************************************************************************************************

GLOBALS:
-------
fsTimer
xmlDoc
menu
navid
active_dropdown_navsubs
active_dropdown_navitem
addbreadcrumb
activepopup
systemversions
race_button_open
test_button_open
race_button_closed
test_button_closed
instructionWin
*******************************************************************************************************/
/*  If Firebug is not installed, then define it's methods so debug statements do not break a page using them */
if(!window.console){
	var console={
		log:function(){return false;}
		,debug:function(){return false;}
		,info:function(){return false;}
		,warn:function(){return false;}
		,error:function(){return false;}
		,assert:function(){return false;}
		,dir:function(){return false;}
		,dirxml:function(){return false;}
		,trace:function(){return false;}
		,group:function(){return false;}
		,groupCollapsed:function(){return false;}
		,groupEnd:function(){return false;}
		,time:function(){return false;}
		,timeEnd:function(){return false;}
		,profile:function(){return false;}
		,profileEnd:function(){return false;}
		,count:function(){return false;}
	};
}

var hostname = window.location.hostname;

var IRACING={
	listings:{}
	,msgs:{}
	,constants:{}
	,UI:{}
	,id2var:function(a){
		if(a.nodeType==1 && a.id)IRACING.UI[a.id]=a;
		var nodes=a.childNodes;
		for(var i=0,ilen=nodes.length;i<ilen;i++)arguments.callee(nodes[i]);
	}
	,script_GET:function(obj,id,src,handler){
		if(obj)obj=null;
		if(el(id))document.getElementsByTagName("head")[0].removeChild(el(id));
		var _s=document.createElement("script");
		_s.type="text/javascript";
		_s.id=id;
		_s.src=src;
		if(document.all){
			_s.onreadystatechange = function(){if(this.readyState=="loaded"||this.readyState=="complete")handler();};
		}else{
			_s.addEventListener("load",handler,false);
			_s.addEventListener("error",handler,false);
		}
		document.getElementsByTagName("head")[0].appendChild(_s);
	}
	,create_confirm:function(data,left,top,isLeft,isTop){
		var popup=element("div",{},{width:data.width,zIndex:"1000",position:"absolute",left:left+"px",top:top+"px"});
			var content=popup.appendChild(element("div",{className:"popup"},{width:data.width,backgroundColor:data.bg,padding:"5px"}));
				content.appendChild(element("div",{innerHTML:data.msg}));
				var buttons=content.appendChild(element("div",{},{padding:"5px 0px",margin:"5px auto 0px",textAlign:"center"}));
					buttons.appendChild(element("a",{innerHTML:"Ok",href:"javascript:IRACING.popup.remove_popup()()",onclick:data.ok_func,className:"btn_enabled"},{marginRight:"2px"}));
					buttons.appendChild(element("a",{innerHTML:"Cancel",href:"javascript:IRACING.popup.remove_popup()()",className:"btn_enabled"}));
		if(isLeft)content.style.left="0px";
		else content.style.right="0px";
		if(isTop)content.style.top="0px";
		else content.style.bottom="0px";
		return popup;
	}
	,popup:{
		popuptimer:null
		,popuptimerover:null
		,activepopup:{popup:null,layernode:null}
		,getOffsets:function(a){
			var left=a.offsetLeft,top=a.offsetTop,b=a;
			while(b=b.offsetParent){left+=b.offsetLeft;top+=b.offsetTop;}
			return {left:left,top:top};
		}
		,create_popup_onclick:function(data,layernode,func,displayOne,left,top,isLeft,isTop){
			var offsets=this.getOffsets(layernode); 
			offsets.left+=left;
			offsets.top+=top;
			var appendnode=document.body;
			var popup=func(data,offsets.left,offsets.top,isLeft,isTop);
			if(displayOne){
				if(this.popuptimer)clearTimeout(this.popuptimer);
				if(this.popuptimerover)clearTimeout(this.popuptimerover);
				if(this.activepopup.popup){
					appendnode.removeChild(this.activepopup.popup);
					this.activepopup.popup=null;
					this.activepopup.layernode=null;
				}
				this.activepopup.popup=popup;
				this.activepopup.layernode=layernode;
			}
			appendnode.appendChild(popup);
		}
		,create_popup:function(data,layernode,func,left,top,isLeft,isTop,remove_onmouseout){
			var that=this;
			return function(){	
				var offsets=that.getOffsets(layernode);
				offsets.left+=left;
				offsets.top+=top;
				var appendnode=document.body;
				if(that.popuptimer)clearTimeout(that.popuptimer);
				that.popuptimerover=setTimeout(function(){
						if(that.activepopup.popup){
							if(that.activepopup.popup==layernode){
								return;
							}else{
								appendnode.removeChild(that.activepopup.popup);
								that.activepopup.popup=null,that.activepopup.layernode=null;
							}	
						}
			
						appendnode.appendChild(that.activepopup.popup=func(data,offsets.left,offsets.top,isLeft,isTop,remove_onmouseout));
						that.activepopup.popup.onmouseover=function(){
							if(that.popuptimer)clearTimeout(that.popuptimer);
						};
						that.activepopup.layernode=layernode;
				},200);
			};
		}
		,remove_popup:function(){
			var that=this;
			return function(e){
				//var toElement=window.event?window.event.toElement:e.relatedTarget;
				if(that.popuptimerover)clearTimeout(that.popuptimerover);
				that.popuptimer=setTimeout(function(){
						if(that.activepopup && that.activepopup.popup){
							document.body.removeChild(that.activepopup.popup);
							that.activepopup.popup=null;
							that.activepopup.layernode=null;
						}
				},200);
			};
		}
	}
};

function writeDocument(s){document.write(s);}
var systemversions=null;
var downloadstatus=null;
var replaydata=null;
var joinurl=null;
var calendar_icon=contextpath+"/images/icons/calendar_icon.gif";
var	overallUpdateRequired=0;
var	overallUpdateAvailable=0;
var fsTimer;
var newWin=null;
var img_arrow_green=imageserver+contextpath+"/images/member/arrow_green.gif";
var customer_support_tel="781-271-1900";
var chathref;
var update_series_addtocart_targets;
var addtocart_arr;
var GET_limit=2048;//as per IE
//window.onerror=function(){return true;};
/*==================== PROTOTYPES ====================*/
Array.prototype.indexOf=function(a){var index=-1;for(var i=this.length;i--;)if(this[i]==a){index=i;break;}return index;}
Array.prototype.objIndexOf=function(a,b){var index=-1;for(var i=this.length;i--;)if(this[i]&&(this[i][b]==a)){index=i;break;}return index;}
if (!Array.prototype.includes) {
	Array.prototype.includes=function(a){for(var i=0;i<this.length;i++){if(this[i]==a) return true;}return false;};
}

// define the following prototypes for IE emulation in Mozilla
if(!document.all){
/*
Event.prototype.__defineGetter__("srcElement", function () {
   var node=this.target;
   while(node.nodeType!=1)node=node.parentNode;
   return node;
});
*/
Event.prototype.__defineSetter__("cancelBubble", function (b) {
   if(b)this.stopPropagation();
});
Event.prototype.__defineGetter__("fromElement", function () {
   var node;
   if(this.type=="mouseover")node=this.relatedTarget;
   else if(this.type=="mouseout")node=this.target;
   else return null;
   while(node.nodeType!=1)node=node.parentNode;
   return node;
});

Event.prototype.__defineGetter__("toElement", function () {
   var node;
   if(this.type=="mouseout")node=this.relatedTarget;
   else if(this.type=="mouseover")node=this.target;
   else return null;
   while(node.nodeType!=1)node=node.parentNode;
   return node;
});

HTMLElement.prototype.__defineGetter__("currentStyle", function(){
	return this.ownerDocument.defaultView.getComputedStyle(this,null);
});
}

Date.prototype.formatUTCdate=function(){
	var d={};
	d.year=this.getUTCFullYear();
	d.month=this.getUTCMonth()+1;
	d.day=this.getUTCDate();
	d.hour=this.getUTCHours();
	d.minutes=this.getUTCMinutes();
	d.seconds=this.getUTCSeconds();
	if(d.month<10)d.month="0"+d.month;
	if(d.day<10)d.day="0"+d.day;
	if(d.hour<10)d.hour="0"+d.hour;
	if(d.minutes<10)d.minutes="0"+d.minutes;
	if(d.seconds<10)d.seconds="0"+d.seconds;
	return d;
}
Date.prototype.formatLocalSelectDate=function(excludeYear){
	var d={};
	d.year=this.getFullYear();
	d.month=this.getMonth()+1;
	d.day=this.getDate();
	d.hour=this.getHours();
	d.minutes=this.getMinutes();
	d.seconds=this.getSeconds();
	if(d.month<10)d.month="0"+d.month;
	if(d.day<10)d.day="0"+d.day;
	if(d.hour<10)d.hour="0"+d.hour;
	if(d.minutes<10)d.minutes="0"+d.minutes;
	if(d.seconds<10)d.seconds="0"+d.seconds;
	
	if (excludeYear) {
		return d.month+"-"+d.day;
	}
	return d.year+"-"+d.month+"-"+d.day;
	
}
Date.prototype.formatLocalTime=function(a){
	var d={};
	var ampm=" am";
	d.hour=this.getHours();
	if(d.hour>=12)ampm=" pm";
	if(d.hour>12)d.hour=d.hour-12;
	if(d.hour==0)d.hour=12;
	
	d.minutes=this.getMinutes();
	if(a)if(d.hour<10)d.hour="0"+d.hour;
	if(d.minutes<10)d.minutes="0"+d.minutes;
	return d.hour+":"+d.minutes+ampm;
}
Date.prototype.formatUTCTime=function(){
	var d={};
	d.hour=this.getUTCHours();
	d.minutes=this.getUTCMinutes();
	if(d.hour<10)d.hour="0"+d.hour;
	if(d.minutes<10)d.minutes="0"+d.minutes;
	return d.hour+":"+d.minutes;
}
Date.prototype.formatUTCTimeHMS=function(){
	var d={};
	d.hour=this.getUTCHours();
	d.minutes=this.getUTCMinutes();
	d.seconds=this.getUTCSeconds();
	if(d.hour<10)d.hour="0"+d.hour;
	if(d.minutes<10)d.minutes="0"+d.minutes;
	if(d.seconds<10)d.seconds="0"+d.seconds;
	return d.hour+":"+d.minutes+":"+d.seconds;
}
Date.prototype.formatLocalTime2=function(){
	var d={};
	var ampm="a";
	d.hour=this.getHours();
	if(d.hour>=12)ampm="p";
	if(d.hour>12)d.hour=d.hour-12;
	if(d.hour==0)d.hour=12;
	
	d.minutes=this.getMinutes();
	if(d.minutes<10)d.minutes="0"+d.minutes;
	return d.hour+":"+d.minutes+ampm;
}
Date.prototype.formatLocalSelectDateYY=function(){
	var d={};
	d.year=this.getFullYear() - 2000;
	d.month=this.getMonth()+1;
	d.day=this.getDate();
	if (d.year < 10) {
		d.year = "0" + d.year;
	}
	if(d.month<10)d.month="0"+d.month;
	if(d.day<10)d.day="0"+d.day;
	return d.year+"-"+d.month+"-"+d.day;
	
}


/*========================== GENERIC SORT FOR OBJECT ARRAYS ===================*/
function sortByProp(prop){
	return function(a,b){
		if (a[prop]<b[prop])return -1;
		else if(a[prop]>b[prop])return 1;
		else return 0;
	};
}

//To look through an array and remove dupes within
function ArrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
}

/*========================== GET DOM OFFSETS ============================*/
function getOffsets(a){
	var left=a.offsetLeft,top=a.offsetTop,b=a;
	while(b=b.offsetParent){left+=b.offsetLeft;top+=b.offsetTop;}
	return {left:left,top:top};
}
/*=========================== NAME UTILS ==========================*/
function acronym(a){
	var a=a.split(" ");
	for(var i=0;i<a.length;i++)a[i]=a[i].substr(0,1);
	return a.join("");
}
function abbrevName(a){
	a=a.split(" ");
	var name=a.shift().substr(0,1)+". ";
	for(j=a.length;j--;)if(a[j].length==1)a[j]+=".";
	return name+=a.join(" ");
}

/*=========================== LAP TIME CONVERSION ==============*/
function getTimeFromMilliseconds(time){
	var hours=Math.floor(time/(3600*10000));
	time=time-hours*3600*10000;
	var min=Math.floor(time/(60*10000));
	time=time-min*60*10000;
	var secs=Math.floor(time/10000);
	time=time-secs*10000;			
	var tenths=Math.floor(time/1000);
	time=time-tenths*1000;
	var hun=Math.floor(time/100);
	time=time-hun*100;
	var thous=Math.floor(time/10);
	if(hours)hours+=":";else hours="";
	if(min<10)min="0"+min;
	if(secs<10)secs="0"+secs;
	return hours+min+":"+secs+"."+tenths+hun+thous;
}

// ******************  Check for local service ***********
function httpserver_missing(missingloc){
	document.location.href=missingloc;
}
// ******************  AJAX  ********************
function load(file,varsobj,handler,args){
	var synch=false;
	var req=window.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest();
	
	if(handler){
		req.onreadystatechange=handler(req,args);
		synch=true;
	}
	if(!varsobj)varsobj={a:null};
	req.open("post",file,synch);
	var vars=[];
	//for(var each in varsobj)vars.push(escape(each)+"="+escape(varsobj[each]));
	for(var each in varsobj)vars.push(escape(each)+"="+escape(varsobj[each]));
	vars=vars.join("&");
	req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	req.send(vars);
	if(!handler)return req.responseText;
}


//document.domain = "127.0.0.1";
function loadGetCrossDomain(file,varsobj,handler,args){
	var synch=false;	
	var req=window.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest();
	
	if (typeof XDomainRequest != "undefined") {
	    // XDomainRequest for IE.
		 req = new XDomainRequest();
	}
	if(handler){
		req.onreadystatechange=handler(req,args);
		synch=true;
	}
	if(!varsobj)varsobj={a:null};
	var vars=[];
	for(var each in varsobj)vars.push(escape(each)+"="+escape(varsobj[each]));
	vars=vars.join("&");
	req.open("get",file+"?"+vars,synch);
	req.send(null);
	if(!handler)return req.responseText;
}


//document.domain = "127.0.0.1";
function loadGet(file,varsobj,handler,args){
	var synch=false;	
	var req=window.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest();
	
	
	if(handler){
		req.onreadystatechange=handler(req,args);
		synch=true;
	}
	if(!varsobj)varsobj={a:null};
	var vars=[];
	for(var each in varsobj)vars.push(escape(each)+"="+escape(varsobj[each]));
	vars=vars.join("&");
	req.open("get",file+"?"+vars,synch);
	req.send(null);
	if(!handler)return req.responseText;
}

function loadAJAX(file,varsobj,handler){
	var vars=[];
	for(var each in varsobj)vars.push(escape(each)+"="+escape(varsobj[each]));
	vars=vars.join("&");
	var req=window.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest();
	
	req.onreadystatechange=handler(req);
	req.open("post",file,true);
	req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	req.send(vars);
}


// ******************  DOM UTILS *******************
function el(a){return document.getElementById(a);}
function nolink(){}
function menunolink(){window.location.reload();}
function element(a,b,c){
    var e=document.createElement(a);
    for(var d in b)
	e[d]=b[d];
    var s=e.style;
    for(d in c)
	s[d]=c[d];
    return e;
}
function imgpreload(src,node,className,setdims){
	
	if (typeof(src) !== "string" || !src.length) {
		console.warn("Can't preload image src: ", src);
		console.log("Args: ", arguments);
		return;
	}
	
	if (node === undefined || node === null || !node) {
		console.warn("Can't preload image on node: ", node);
		console.log("Args: ", arguments);
		return;
	}
	
	var img=new Image();
	img.src=src;
	if(className)img.className=className;
	var si=setInterval(function(){
		if(img.width){
			clearInterval(si);
			node.appendChild(img);
			if(setdims){
				node.style.width=img.width+"px";
				node.style.height=img.height+"px";
			}
		}
	},15);
}
function removeOptions(n){if (!n) return;var c=n.childNodes;while(c.length)n.removeChild(c[c.length-1]);}
function set_node_null(a){
	//comment out for now.  Chrome/WebKit browsers don't like the null assignment using hasOwnProperty
	/*
	var childnodes=a.childNodes;
	for(var i=0,ilen=childnodes.length;i<ilen;i++){
		var node=childnodes[i];
		for(var j in node){
			if(node.hasOwnProperty){
				if(node.hasOwnProperty(j))node[j]=null;
			}else{
			}
		}
		if(node.childNodes.length)set_node_null(node);
		node=null;
	}
	*/
}
/*============================== COLOR CONTRAST =============================*/
var colorcontrast={};
colorcontrast.wr=parseInt("#ffffff".substring(1,3),16);
colorcontrast.wg=parseInt("#ffffff".substring(3,5),16);
colorcontrast.wb=parseInt("#ffffff".substring(5),16);
colorcontrast.br=parseInt("#000000".substring(1,3),16);
colorcontrast.bg=parseInt("#000000".substring(3,5),16);
colorcontrast.bb=parseInt("#000000".substring(5),16);
function find_max_contrast(a){
	var choosewhite=0,chooseblack=0;
	var r=parseInt(a.substring(1,3),16);
	var g=parseInt(a.substring(3,5),16);
	var b=parseInt(a.substring(5),16);
	var contrast_white=Math.max(colorcontrast.wr,r)-Math.min(colorcontrast.wr,r)+Math.max(colorcontrast.wg,g)-Math.min(colorcontrast.wg,g)+Math.max(colorcontrast.wb,b)-Math.min(colorcontrast.wb,b);
	var contrast_black=Math.max(colorcontrast.br,r)-Math.min(colorcontrast.br,r)+Math.max(colorcontrast.bg,g)-Math.min(colorcontrast.bg,g)+Math.max(colorcontrast.bb,b)-Math.min(colorcontrast.bb,b);
	var bright_white=Math.abs((r*299+g*587+b*114)/1000-(colorcontrast.wr*299+colorcontrast.wg*587+colorcontrast.wb*114)/1000);
	var bright_black=Math.abs((r*299+g*587+b*114)/1000-(colorcontrast.br*299+colorcontrast.bg*587+colorcontrast.bb*114)/1000);
	if(bright_white>bright_black)choosewhite++;else chooseblack++;
	if(contrast_white>contrast_black)choosewhite++;else chooseblack++;
	var textcolor="#000000";
	if(choosewhite>chooseblack)textcolor="#ffffff";
	return textcolor;
}
//================================ PANEL ANIMATION ==========================*/
function findTarget(e){
	var target;
	if(window.event && window.event.srcElement){
		target=window.event.srcElement;
		//window.event.cancelBubble = true;
	}else if(e && e.target){
		target=e.target;
  	//e.stopPropagation();
	}
	if(!target)return null;
	while(target!=document.body && target.nodeName.toLowerCase()!="a")target=target.parentNode;
	if(target.nodeName.toLowerCase()!="a")return null;
	return target;	
}
function mouseover(e){
	var target=findTarget(e);
	if(!target)return;
	var imgnode=target.childNodes[0];
	imgnode.src=imgnode.src.replace(/(\.[^.]+)$/,"_hover$1");
}
function mouseout(e){
	var target=findTarget(e);
	if(!target)return;
	var imgnode=target.childNodes[0];
	imgnode.src=imgnode.src.replace(/_hover(\.[^.]+)$/,"$1");
}
var race_button_closed=element("a",{id:"race_button"},{display:"inline"});
var test_button_closed=element("a",{id:"test_button"},{display:"inline"});
var race_button_open=element("a",{id:"race_button"},{display:"inline"});
var test_button_open=element("a",{id:"test_button"},{display:"inline"});
//var race_button_flash=element("a",{id:"race_button"});
//var test_button_flash=element("a",{id:"test_button"});
/* Fixing Integration Issue */
function init_racetest_buttons(){
	//imgpreload(imageserver+"/member_images/buttons/race_button_closed.png",race_button_closed,"navitem_racetest");
	race_button_closed.href="javascript:changepanel('racingpanel')";
	race_button_closed.style.backgroundImage="url('"+imageserver+"/member_images/buttons/race_button_sprite.png')";
	//imgpreload(imageserver+"/member_images/buttons/test_button_closed.png",test_button_closed,"navitem_racetest");
	test_button_closed.href="javascript:changepanel('testingpanel')";
	test_button_closed.style.backgroundImage="url('"+imageserver+"/member_images/buttons/test_button_sprite.png')";
	//imgpreload(imageserver+"/member_images/buttons/race_button_open.png",race_button_open,"navitem_racetest");
	race_button_open.href="javascript:changepanel('racingpanel')";
	race_button_open.style.backgroundImage="url('"+imageserver+"/member_images/buttons/race_button_sprite.png')";
	//imgpreload(imageserver+"/member_images/buttons/test_button_open.png",test_button_open,"navitem_racetest");
	test_button_open.href="javascript:changepanel('testingpanel')";
	test_button_open.style.backgroundImage="url('"+imageserver+"/member_images/buttons/test_button_sprite.png')";
	//imgpreload(imageserver+"/member_images/buttons/race_button_flash.gif",race_button_flash,"navitem_racetest");
	//imgpreload(imageserver+"/member_images/buttons/test_button_flash.gif",test_button_flash,"navitem_racetest");
}
function changepanel(a){
	var testingpanel=el("testingpanel");
	var racepanel=el("racingpanel");
	var state=Get_Cookie("panelstate");
	if(!state)slide_out(a);
	else {
		if(a=="testingpanel"){
			if(state==6 || state==4)slide_in(a);
			else slide_out(a);
		}else{
			if(state==2 || state==3 || state==7 || state==9)slide_in(a);
			else slide_out(a);
		}
	}
}
function showpanel(){
	el("testingpanel").style.zIndex="1";
	el("racingpanel").style.zIndex="2";
	var state=Get_Cookie("panelstate");
	Set_Cookie("panelstate",state | 1);
}
function slide_out(a){
	var testingpanel=el("testingpanel");
	var racepanel=el("racingpanel");
	var state=Get_Cookie("panelstate");
	var maxheight;
	if(a=="testingpanel"){
		testingpanel.style.visibility="visible";
		maxheight=parseInt(testingpanel.currentStyle.height);
		testingpanel.style.zIndex="2";
		racepanel.style.zIndex="1";
		if(state & 16)state=state&~16;
		if(state & 1)state=state&~1;
		Set_Cookie("panelstate",state);
		if(state & 4)return;
		Set_Cookie("panelstate",state|4);
		test_button_closed.parentNode.replaceChild(test_button_open,test_button_closed);
	}else{
		racepanel.style.visibility="visible";
		maxheight=parseInt(racepanel.currentStyle.height);
		testingpanel.style.zIndex="1";
		racepanel.style.zIndex="2";
		if(state & 8)state=state&~8;
		Set_Cookie("panelstate",state=(state|1));
		if(state & 2)return;
		Set_Cookie("panelstate",state|2);
		race_button_closed.parentNode.replaceChild(race_button_open,race_button_closed);
	}
	
	var target=el(a);
	//var maxheight=target.offsetHeight;
	var top=0;
	if (target) {
		var si=setInterval(function(){
			if(top<-(maxheight+8)){
				top=-(maxheight+8);
				target.style.top=top+"px";
				clearInterval(si);
			}else{
				target.style.top=top+"px";
				top-=10;
			}
		},15);
	}
}
function slide_in(a){
	var testingpanel=el("testingpanel");
	var racepanel=el("racingpanel");
	var state=Get_Cookie("panelstate");
	var maxheight;
	if(a=="testingpanel"){
		maxheight=parseInt(testingpanel.currentStyle.height);
		test_button_open.parentNode.replaceChild(test_button_closed,test_button_open);
		Set_Cookie("panelstate",state&~5);
		
	}else{
		if(racingpaneldata.session)return;
		maxheight=parseInt(racepanel.currentStyle.height);
		race_button_open.parentNode.replaceChild(race_button_closed,race_button_open);
		Set_Cookie("panelstate",state&~3);
	}
	
	var target=el(a);
	//var maxheight=target.offsetHeight;	
	var top=-(maxheight);
	var si=setInterval(function(){
		if(top>0){
			top=0;
			target.style.top=top+"px";
			clearInterval(si);
			//testingpanel.style.visibility="hidden";
			//racepanel.style.visibility="hidden";
		}else{
			target.style.top=top+"px";
			top+=10;
		}
	},15);
}
function checkpanelstate(){
	var state;
	init_racetest_buttons();
	var racenavbar=el("racenavbar");
	if(el("racenavbar"))racenavbar=el("racenavbar");
		var racetest=racenavbar.appendChild(element("div",{id:"navitem_controls"}));
	var racepanel=el("racingpanel");
	var testingpanel=el("testingpanel");
	if(state=Get_Cookie("panelstate")){
		if(state & 4){
			testingpanel.style.top="-"+(parseInt(testingpanel.currentStyle.height)+8)+"px";
			testingpanel.style.visibility="visible";
			racetest.appendChild(test_button_open);
		}else racetest.appendChild(test_button_closed);
		if(state & 2){
			racepanel.style.top="-"+(parseInt(racepanel.currentStyle.height)+8)+"px";
			racepanel.style.visibility="visible";
			racetest.appendChild(race_button_open);
		}else racetest.appendChild(race_button_closed);
		if((state & 3)==3){
			racepanel.style.zIndex="2";
			testingpanel.style.zIndex="1";
		} else if ((state == 7)/* || (state == 0)*/) {
			changepanel('racingpanel');
		}else {
			racepanel.style.zIndex="1";
			testingpanel.style.zIndex="2";
		}
		if(state & 8){
			window.onload=function(){
				slide_out("racingpanel");
			};
		}
		if(state & 16){
			window.onload=function(){
				slide_out("testingpanel");
			}
		}
	}else {
		racetest.appendChild(test_button_closed);
		racetest.appendChild(race_button_closed);
	}
}
// ******************************** POPUPS *********************************
var activepopup={popup:null,layernode:null};
var popuptimer=null;
var popuptimerover=null;
function cancelbubble(e){
	if(window.event)window.event.cancelBubble=true;
	else if(e)e.stopPropagation();
}


function popup_helmet(data,offsetleft,offsettop){
		var popup=element("div",{},{position:"absolute",width:"150px",height:"100px",top:offsettop+"px",left:offsetleft+"px",padding:"5px",backgroundColor:"white",border:"1px solid black",textAlign:"left"});
		var viewdriverlink=popup.appendChild(element("a",{innerHTML:"View Driver",href:contextpath+"/member/CareerStats.do?custid="+data.custid,className:"driverlink"}));
		var addfriendlink=popup.appendChild(element("div",{innerHTML:["Send Friend Request","Remove Friend","Revoke Friend Request", "Accept Friend Request"][data.friend],className:"driver_popup"}));	
		
		switch(data.friend){
		case 0:
			addfriendlink.onclick=sendfriendrequest(data);
			break;
		case 1:
			addfriendlink.onclick=removefriend(data);
			break;
		case 2:
			addfriendlink.onclick=revokefriendrequest(data);
			break;
		case 3:
			addfriendlink.onclick=acceptfriendrequest(data);
			break;	
		default:
		}
		//addfriendlink.onclick=addremovefriend(data);
		
	
		
		addfriendlink.onmouseover=function(e){this.className="driver_popup_hover"};
				addfriendlink.onmouseout=function(e){this.className="driver_popup"};
		var addwatchlink=popup.appendChild(element("div",{innerHTML:["Add Studied","Remove Studied"][data.watch],className:"driver_popup"}));	
				addwatchlink.onclick=addremovewatch(data);
				addwatchlink.onmouseover=function(e){this.className="driver_popup_hover"};
				addwatchlink.onmouseout=function(e){this.className="driver_popup"};
		var pmlink=popup.appendChild(element("div",{innerHTML:"Private Message",className:"driver_popup"}));
			pmlink.onclick=sendjforumpm(data.custid);
			//pmlink.onclick=sendpm(data.displayName);
			pmlink.onmouseover=function(e){this.className="driver_popup_hover"};
			pmlink.onmouseout=function(e){this.className="driver_popup"};
		var forumprofilelink=popup.appendChild(element("div",{innerHTML:"Forum Profile",className:"driver_popup"}));
			forumprofilelink.onclick=visitjforumprofile(data.custid);
			forumprofilelink.onmouseover=function(e){this.className="driver_popup_hover"};
			forumprofilelink.onmouseout=function(e){this.className="driver_popup"};

		//Blacklist code that will hook into helmetPopups.js
		var blacklistlink = popup.appendChild(element("div", {
			innerHTML : ["Add to Blacklist","Remove from Blacklist"][(isBlacklisted(data.custid) ? 1 : 0)],
			className : "driver_popup"
		}));
		blacklistlink.id = "blink_" + data.custid;

		blacklistlink.onclick = blacklistMember(data.custid);

		if (isBlacklisted(data.custid)) {
			blacklistlink.onclick = whitelistMember(data.custid);
		}

		blacklistlink.onmouseover = function(e) {
			this.className = "driver_popup_hover"
		};
		blacklistlink.onmouseout = function(e) {
			this.className = "driver_popup"
		};


		return popup;
}

function popup_calendar(data,offsetleft,offsettop){
	var inputdate=data.date;
	var func=data.func;
	var months="January,February,March,April,May,June,July,August,September,October,November,December".split(",");
	var days="S,M,T,W,T,F,S".split(",");
 	var dayms=24*60*60*1000;
	var div=element("div",{},{position:"absolute",top:offsettop+"px",left:offsetleft+"px"});
	function rebuild_table(date){
		div.replaceChild(build_table(date),div.childNodes[0]);
		//func(date);
	}
	function build_table(date){
		var prevmonth,prevyear,nextmonth,nextyear;
		var today=new Date();
  	var datems=date.getTime();
  	var datemonth=date.getMonth();
		var dateyear=date.getFullYear();
		var dateday=date.getDate();
  	var firstday=new Date(datems-(date.getDate()-1)*24*60*60*1000);
		var firstdayms=firstday.getTime();
		var firstday=firstday.getDay();
		var prevmaxdays=new Date(new Date(dateyear,datemonth,1).getTime()-dayms).getDate();
		var nextmaxdays=new Date(new Date(dateyear,datemonth+2,1).getTime()-dayms).getDate();
		if(datemonth==0){
			prevmonth=11;
			prevyear=dateyear-1;
		}else{
			prevmonth=datemonth-1;
			prevyear=dateyear;
		}
		if(datemonth==11){
			nextmonth=0;
			nextyear=dateyear+1;
		}else{
			nextmonth=datemonth+1;
			nextyear=dateyear;
		}
		var prevdate=new Date();
		prevdate.setFullYear(prevyear,prevmonth,Math.min(prevmaxdays,dateday));
		var nextdate=new Date();
		nextdate.setFullYear(nextyear,nextmonth,Math.min(nextmaxdays,dateday));
	  	var table=element("table",{id:"datepicker"},{background:"#ffffff"});
			var tbody=table.appendChild(element("tbody"));
				var monthbar=tbody.appendChild(element("tr",{id:"monthbar"}));
					var prev=monthbar.appendChild(element("td",{innerHTML:"&lt;",className:"pointer"}));
					prev.onclick=function(){rebuild_table(prevdate);};
					var monthname=monthbar.appendChild(element("td",{innerHTML:months[date.getMonth()]+" "+date.getFullYear(),colSpan:"5",className:"center"}));
					var next=monthbar.appendChild(element("td",{innerHTML:"&gt;",className:"pointer"}));
					next.onclick=function(){rebuild_table(nextdate);};
				var row=tbody.appendChild(element("tr",{id:"daysbar"}));
					for(var i=0;i<days.length;i++)row.appendChild(element("td",{innerHTML:days[i],className:"center"}));
				row=tbody.appendChild(element("tr"));
				var i=0,j=0;
				while(j++<firstday)row.appendChild(element("td",{innerHTML:"&nbsp"}));
      			while(new Date(firstdayms+i*dayms).getMonth()==datemonth){
       				if(!((i+firstday)%7))row=tbody.appendChild(element("tr"));
					var datecelltd=row.appendChild(element("td"));
				  		var datecell=datecelltd.appendChild(element("div",{innerHTML:i+1,className:"datecell"}));
						if((date.getDate()-1)==i && datemonth==inputdate.getMonth())datecell.style.background="#888888",datecell.style.color="#ffffff";
						if((today.getDate()-1)==i && today.getMonth()==datemonth)datecell.style.border="1px solid black";
						datecell.onclick=function(){
							var newdate=new Date();
							newdate.setFullYear(dateyear,datemonth,parseInt(this.innerHTML));
							func(newdate);
						};
					i++;
				}
  		return table;
 	}
 	div.appendChild(build_table(inputdate));
 	return div;
}
function formatdate(y,m,d,func){
	return function(){
		if(m<10)m="0"+m;
		if(d<10)d="0"+d;
		func(y+"-"+m+"-"+d);
	};
}

function build_popup(data,layernode,func,left,top){
	return function(e){	
		var appendnode=this;
		if(popuptimer)clearTimeout(popuptimer);
		popuptimerover=setTimeout(function(){
			if(activepopup.popup){
				if(activepopup.popup.parentNode==appendnode){
					return;
				}else{
					//reset zIndex of parentNode to reestablish the default stacking order context
					activepopup.layernode.style.zIndex="1";
					activepopup.popup.parentNode.removeChild(activepopup.popup);
					activepopup.popup=null,activepopup.layernode=null;
				}
			}
			
			appendnode.appendChild(activepopup.popup=func(data,left,top));
			activepopup.layernode=layernode;
			//set zIndex of parentNode to alter stacking context of rows so that popup always appears above rows 
			layernode.style.zIndex="2";
		},200);
	}
}


function removepopup_notimer(){
	if(popuptimerover)clearTimeout(popuptimerover);
	if(activepopup.popup)activepopup.layernode.style.zIndex="1",activepopup.popup.parentNode.removeChild(activepopup.popup),activepopup.popup=null,activepopup.layernode=null;
}
function removepopup(){
	if(popuptimerover)clearTimeout(popuptimerover);
	//var appendnode=this;
	popuptimer=setTimeout(function(){if(activepopup.popup)activepopup.layernode.style.zIndex="1",activepopup.popup.parentNode.removeChild(activepopup.popup),activepopup.popup=null,activepopup.layernode=null},200);
}

function sendfriendrequest(data){
	return function(){
	if(!data.friend){
		
		var result=load(contextpath+"/member/SendFriendRequest",{custid:data.custid});
		if(result==2){
			data.friend=2,this.innerHTML="Revoke Friend Request";
		}else if(result==4){
			iRacingAlerts("You cannot send this friend request. You already have the maximum number of allowed (friends + outbound friend requests).");
		}
	}
		if(data.friendspage){
			window.location.reload();
		}else if(data.reload){
			activepopup.popup=null,activepopup.layernode=null;
			data.reload.call(this);
		}else if(data.modify){
			data.modify(data);
		}
		else if (data.callback) {
			activepopup.popup=null,activepopup.layernode=null;
			data.callback(data);			
		}
	}
}

function acceptfriendrequest(data){
	return function(){

		if(data.friend){
			var result=load(contextpath+"/member/AcceptFriendRequest",{custid:data.custid});
			if(result==1){
				data.friend=1,this.innerHTML="Remove Friend";
			}else if(result==4){
				iRacingAlerts("You cannot accept this friend request.  You already have the maximum number of allowed friends.");
			}
		}
			if(data.friendspage){
				window.location.reload();
			}else if(data.reload){
				activepopup.popup=null,activepopup.layernode=null;
				data.reload.call(this);
			}else if(data.modify){
				data.modify(data);
			}
			else if (data.callback) {
				activepopup.popup=null,activepopup.layernode=null;
				data.callback(data);			
			}
		}
	}

function revokefriendrequest(data){
	return function(){
			if(data.friend){
				var result=load(contextpath+"/member/RevokeFriendRequest",{custid:data.custid});
				if(result==0){
					data.friend=0,this.innerHTML="Send Friend Request";
				}
			}
				if(data.friendspage){
					window.location.reload();
				}else if(data.reload){
					activepopup.popup=null,activepopup.layernode=null;
					data.reload.call(this);
				}else if(data.modify){
					data.modify(data);
				}
				else if (data.callback) {
					activepopup.popup=null,activepopup.layernode=null;
					data.callback(data);			
				}
			}
}
		
		

function removefriend(data){
	
	return function(){

		if(data.friend){
			var result=load(contextpath+"/member/RemoveFriend",{custid:data.custid});
		
			if(result==0){
				data.friend=0,this.innerHTML="Send Friend Request";
			}
		}
		if(data.friendspage){
			window.location.reload();
		}else if(data.reload){
			activepopup.popup=null,activepopup.layernode=null;
			data.reload.call(this);
		}else if(data.modify){
			data.modify(data);
		}
		else if (data.callback) {
			activepopup.popup=null,activepopup.layernode=null;
			data.callback(data);			
		} 
	}
}


function addremovewatch(data){
	return function(){
		//debugger;
		if(data.watch==1){
			var result=load(contextpath+"/member/RemoveWatched",{custid:data.custid});
			if(result=="1"){
				data.watch=0,this.innerHTML="Add Studied";
			}
		}else{
			var result=load(contextpath+"/member/AddWatched",{custid:data.custid});
			//alert("not watch "+result+" "+data.watch+" "+data.custid);
			if(result=="1") {
				data.watch=1,this.innerHTML="Remove Studied";
			}
		}
		if(data.watchpage){
			window.location.reload();
		}else if(data.reload){
			activepopup.popup=null,activepopup.layernode=null;
			data.reload.call(this);
		}else if(data.modify){
			data.modify(data);
		}
		else if (data.callback) {
			activepopup.popup=null,activepopup.layernode=null;
			data.callback(data);			
		}
	}
}
function sendpm(displayName){
	return function(){
		var loc ="/iforum/pmpost!default.jspa?to="+escape(displayName);
 		top.newWin = window.open(loc, "forum", 'resizable=1, scrollbars=1, status=0,toolbar=0');
	  	newWin.focus();
  	}
}

function sendjforumpm(custid){
	return function(){
		var loc ="/jforum/pm/sendTo/"+custid+".page";
 		top.newWin = window.open(loc, "Jforum", 'resizable=1, scrollbars=1, status=0,toolbar=0');
	  	newWin.focus();
  	}
}

function sendleaguejforumpm(custid){
	var loc ="/jforum/pm/sendTo/"+custid+".page";
 	top.newWin = window.open(loc, "Jforum", 'resizable=1, scrollbars=1, status=0,toolbar=0');
	newWin.focus();
}



function visitjforumprofile(custid){
	return function(){
		var loc ="/jforum/user/profile/"+custid+".page";
 		top.newWin = window.open(loc, "Jforum", 'resizable=1, scrollbars=1, status=0,toolbar=0');
	  	newWin.focus();
  	}
}


function linkToForum(url) {
 	var loc = url;
  // 	top.newWin = window.open(loc, "Jforum");
    top.newWin = window.open(loc, "forum");
   	newWin.focus();
}



/*==================== NEW MENU NAV =========================*/
function hilite_navbar() {
	
	var matchSTR 	= new RegExp(navid,"gi");
	var returnSTR 	= true;
	if (matchSTR) {
		$(".simpleNav a").each(function() {
			var navHTML = $(this).text();
			if ( matchSTR.test(navHTML) ) {
				$(this).addClass("active");
				returnSTR = false;
			};
			return returnSTR;
		});
	};
	
}


//  ***************   IRACING COOKIE HANDLING FUNCTIONS   ******************
function Set_Cookie( name, value, expires, path, domain, secure ) 
{
// set time, it's in milliseconds
var today = new Date();
today.setTime( today.getTime() );

/*
if the expires variable is set, make the correct 
expires time, the current script below will set 
it for x number of days, to make it for hours, 
delete * 24, for minutes, delete * 60 * 24
*/
if ( expires )
{
expires = expires * 1000 * 60 * 60 * 24;
}
var expires_date = new Date( today.getTime() + (expires) );

document.cookie = name + "=" +escape( value ) +
( ( expires ) ? ";expires=" + expires_date.toGMTString() : "" ) + 
( ( path ) ? ";path=" + path : "" ) + 
( ( domain ) ? ";domain=" + domain : "" ) +
( ( secure ) ? ";secure" : "" );
}


// this function gets the cookie, if it exists
function Get_Cookie( name ) {
	
var start = document.cookie.indexOf( name + "=" );
var len = start + name.length + 1;
if ( ( !start ) &&
( name != document.cookie.substring( 0, name.length ) ) )
{
return null;
}
if ( start == -1 ) return null;
var end = document.cookie.indexOf( ";", len );
if ( end == -1 ) end = document.cookie.length;
return unescape( document.cookie.substring( len, end ) );
}
			

// this deletes the cookie when called
function Delete_Cookie( name, path, domain ) {
if ( Get_Cookie( name ) ) document.cookie = name + "=" +
( ( path ) ? ";path=" + path : "") +
( ( domain ) ? ";domain=" + domain : "" ) +
";expires=Thu, 01-Jan-1970 00:00:01 GMT";
}


function resetCookieTimeout(name) {
	
	var value = Get_Cookie(name);
	
	if (value) {
		Set_Cookie(name, value, '4000', '/', '', '');
	}
	
}


//********   Login Functions and Warnings ***************************

function submitLoginForm(){
	var thisForm = document.LOGIN;
	
	//Validate the Form
	if((thisForm.password.value=="") || (thisForm.username.value=="")){
		var Alerts = document.getElementById("alertauto");
		if (Alerts != null && Alerts != undefined) {
			document.getElementById("alertauto").innerHTML="Please supply an email address and password.";
		}
		return;
	}
	//Set an auto login cookie that will last for 10 years
	if (thisForm.AUTOLOGIN.checked) {
		//Make sure the user does not have an autologin cookie - gets overwritten
		Delete_Cookie('autologin2', '/','');
	}
	
	//Submit the login
	if (thisForm.submit != null && thisForm.submit != undefined && typeof(thisForm.submit) == "function") {
		thisForm.submit();
	} else if (thisForm.submit != null && thisForm.submit != undefined && typeof(thisForm.submit) == "object") {
		thisForm.submit.click();
	}
}
function submitenter(myfield,e){
	return true;
	var keycode;
	if (window.event) keycode = window.event.keyCode;
	else if (e) keycode = e.which;
	else return true;
	if (keycode == 13){
		
		if (myfield.form.submit != null && myfield.form.submit != undefined && typeof(myfield.form.submit) == "function") {
			myfield.form.submit();
		} else if (myfield.form.submit != null && myfield.form.submit != undefined && typeof(myfield.form.submit) == "object") {
			myfield.form.submit.click();
		}
		
   		return false;
	}else return true;
}
function checkAutoLogin(){
	var thisForm = document.LOGIN;
	if(Get_Cookie( 'autologin' )){
		thisForm.AUTOLOGIN.checked=true;
		thisForm.submit();	
	}
}
function checkFailedAutoLogin(){
	var thisForm = document.LOGIN;
	if(Get_Cookie( 'autologin' )){
		thisForm.AUTOLOGIN.checked=true;
		var login = Get_Cookie( 'autologin' );
		var loginname = login.substring(0,login.indexOf("~**~**~"));
		var loginpass = login.substring(login.indexOf("~**~**~")+7,login.length);
	}
}

/*function launchAutoLoginWarning(){
	var thisForm = document.LOGIN;
	var alertauto = el("alertauto");
	if(thisForm.AUTOLOGIN.checked)alertauto.innerHTML = "This will allow any user of this computer to access your account.";
	else alertauto.innerHTML = "&nbsp;";
}*/

function showFeedback() {
	var messageHeight = $('#feedbackMessage').height();
	$('#feedbackMessage').slideDown(400);
	$('#feedbackTop, #feedbackBottom').animate({height: '20'}, 400);
	$('#feedbackMiddle').animate({height: messageHeight}, 400);
}
function hideFeedback() {
	$(".auto-lg-warning").slideUp(400, function() {
		$(this).remove();
	});
	if (!$('#feedbackMessage').parent().hasClass("errorTile")) {
		$('#feedbackMessage').slideUp(400);
		$('#feedbackTop, #feedbackBottom, #feedbackMiddle').animate({height: '0'}, 400);
	}
}

function autoLoginWarning() {
	var thisForm = document.LOGIN;
	var feedbackMessage = document.getElementById('feedbackMessage');
	if(thisForm.AUTOLOGIN.checked) {
		$(".auto-lg-warning").remove();
		
		$("<div>", {
			"class"		: "auto-lg-warning clearfix",
			"html"		: "Allows any user of this computer to access your account"
		}).hide().insertAfter(".login-w:first .login-left").slideDown(250);
	} else {
		hideFeedback();
	}
}

function checkField() {
	var email = document.forms[0].elements[0];
	var password = document.forms[0].elements[1];
	
	if(email.value != 0) {
		$(email).removeClass('username');
	} else {
		$(email).addClass('username');
	}
	if(password.value != 0) {
		$(password).removeClass('password');
	} else {
		$(password).addClass('password');
	}
}

function hideForm() {
	$('#content').fadeTo(500, 0.01, function() {
		$(this).slideUp(500, function() {
			$(this).remove();
		});
	});
	showFeedback();
}

//***************   Date-Time Functions ********************
function getDateTime(millisecs){
	var d = new Date(millisecs);
	return d;
}

function getDateAndTime(millisecs){
	return getDate(millisecs)+ " <BR>" + getTime(millisecs);
}

function getDate(millisecs){
	var d = new Date(millisecs);
	var Month = "";
	return d.getMonth()+1 +"/"+d.getDate()+"/"+d.getFullYear();
}

function getTime(millisecs){
	var ampm=" a.m.";
	var d = new Date(millisecs);
	var hours = d.getHours();
	if(hours>=12){var ampm=" p.m.";}
	if(hours>12)hours=hours-12;
	if(hours==0)hours=12;
	var mins = d.getMinutes();
	if(mins <= 9){mins = "0" + mins; }
	
	
	
	return hours+":"+mins+ampm;
}


function getDateAddDays(days){
	var d = new Date();
	var lDate = d.valueOf();
	//Add the correct number of days to the list
	lDate = lDate + (days * (1000*60*60*24));
	var dd = new Date(lDate);
	return dd.getMonth()+1 +"/"+dd.getDate()+"/"+dd.getFullYear();
}




// ************** NAV functions ***********************
function autoLaunchForum(url){
	var loc = url;
   	top.newWin = window.open(loc, "Jforum");
	//top.newWin = window.open(loc, "forum");
   	//, 'resizable=1,menubar=1,location=1, scrollbars=1, status=1,toolbar=1');
  	newWin.focus();
}

function launchForum(url){
 	var loc = (url ? url : "/jforum");
  	top.newWin = window.open(loc, "Jforum");
   	newWin.focus();
}

function closeForum(){
	if(top.newWin){
		newWin.close();
	}
}
function closeFriends(){
 	if(top.friendsWin && !top.friendsWin.closed){
 		var loc ="/membersite/member/chat/buddylistoff.jsp";
 		var friendsWin = window.open(loc, "friendsWin", 'WIDTH=210, HEIGHT=540,resizable=0, scrollbars=0, status=0,toolbar=0'); 
 	}
}

function closeMeeting(){
	if(top.meetroomWin  && !top.meetroomWin.closed){
		var loc ="/membersite/member/chat/chatroomoff.jsp";
 		var meetroomWin = window.open(loc, "meetroomWin", 'WIDTH=700, HEIGHT=600,resizable=1, scrollbars=0, status=1,toolbar=0');

		//meetroomWin.close();
	}
}

function closepostsession(){
	if(top.postracechat  && !top.postracechat.closed){
		postracechat.close();
	}
}

function closepresession(){
	if(top.preracechat  && !top.preracechat.closed){
		preracechat.close();
	}
}

var launchingSession = false;
function LaunchSession(){
	if (launchingSession) {
		return;
	}
	launchingSession = true;
    closeFriends();
  	setTimeout("closeMeeting()",100);
  	setTimeout("closepresession()",100);
  	setTimeout("closepostsession()",100);
    setTimeout(function(){document.location.href=joinurl;},1000);
}

function logoutUser(path, janusURL){
	/*
	// Clear target janus url
	if (!janusURL && typeof(MemPrefsListing) === "object" && !MemPrefsListing.janus) {
		janusURL = "";
	}
	
	if (!janusURL && typeof(MemPrefsListing) === "object" && MemPrefsListing.janus && MemPrefsListing.janus.janus_auth_url) {
		janusURL = MemPrefsListing.janus.janus_auth_url;
	}
	
	// Look for the other cookies and delete them
	var cookies = document.cookie.split(";");
	if (cookies.length) {
		for (var i=0;i<cookies.length;i++) {
			var each = cookies[i].split("=");
			if (each[0].indexOf("irsso") !== -1) {
				Delete_Cookie(each[0],'/','');
				Delete_Cookie(each[0].trim(),'/','');
			}
		}
	}
	
	// Overwrite
	if (janusURL && janusURL.length) path = janusURL + "/?ref=" + location.origin + "/membersite";
	*/
	
	closeForum();
	Delete_Cookie('autologin2','/','');
	document.location.href = path;
}

function changeMemberPage(newPage){

	var offset = new Date().getTimezoneOffset();
	var dToday = new Date();
	var mn = (dToday.getMonth()+1);
	var month = new String(mn);
	if(month.length<2){
		month = "0"+month;
	}
	var dy = dToday.getDate();
	var day = new String(dy);
	if(day.length<2){
		day = "0"+day;
	}
	var todaysDate = dToday.getFullYear()+"-"+ month +"-"+day;
	document.location.href=newPage+"?&utcoffset="+offset;
}

//*******************   Countdown Timer Functions *******************************
var timerID = null;
var timerRunning = false;
function stopClock(){
	if(timerRunning) clearTimeout(timerID);
	timerRunning =false;
	
	}

function startClock(){
	stopClock();
	countDown();
}

function countDown() {
	
	timerRunning = true;
	var formName = "COUNTER0";
	var secsDisp = "0"
	var minsDisp = "0";

	if(document.forms[formName]){
		
		var startTime = document.forms[formName].COUNTER.value;
	//	alert(startTime);
		var currentTime = new Date().valueOf();
		var timeSecs = (startTime - currentTime) * .001;
		
		var reloadFrame = false;
		if(timeSecs<-10){reloadFrame=true;}
		if(timeSecs>0){
			//timeSecs = timeSecs -1 ;
		}else{
			timeSecs = 0;
		}
		//Figure Out the time to Display
		var mins = 0;
		var secs = 0;
		secsDisp = "00";
		//We only need to do anything if there is more than 0 secsonds
		if(timeSecs > 0){
			
			if(timeSecs>59){
				mins = timeSecs/60;
				secs = timeSecs%60;
			
			
				if(mins.toString().indexOf(".")>-1){
					mins = mins.toString().substring(0,mins.toString().indexOf("."));
				}
				
				var sMins = new String(mins);
 				if(sMins.indexOf('.')>-1){
 					sMins = sMins.substring(0,sMins.indexOf('.'));
 				}

			
				if(sMins.length < 2){
					minsDisp = "0" + sMins;
				}else{
					minsDisp = sMins;
				}
			}else{
				secs = timeSecs;
				
			}	
		}
 		
 		var sSecs = new String(secs);
 		
 		if(sSecs.indexOf('.')>-1){
 			sSecs = sSecs.substring(0,sSecs.indexOf('.'));
 		}
 		
 		if(sSecs.length < 2){
			secsDisp = "0" + sSecs;
		}else{
			secsDisp = sSecs;
		}
	
	if(minsDisp.length<2){minsDisp = "0"+minsDisp;}
	if(secsDisp.length<2){secsDisp = "0"+secsDisp;}
		setTimeImages(minsDisp,secsDisp);	
		//Set the hidden timer to the correct seconds
    	//document.forms[formName].COUNTER.value = timeSecs;//updateDisplay(countMin, countSec);
 	}
 	
 	timerID = setTimeout("countDown()",1000); 	
 	if(reloadFrame < -10){
 		var loc = regSessCounter.location.href;
 		var newLoc = loc + "&rnd="+new String(currentTime);
 		//alert(newLoc);
		top.regSessCounter.location = newLoc;
		return;
		}
 	
}
/*============================== CHECK UPDATES ===============================*/
function viewUpdates(loc, autoStart){
	var left,top;
	//IE top is 0 of content in browser, whereas Mozilla top is 0 of browser
	if(window.screenLeft){
		left=window.screenLeft;
		top=window.screenTop;
	}else {
		left=window.screenX;
		top=window.screenY;
	}
	
	//offset top, left by 50 pixels
	if(window.outerHeight)top=window.outerHeight-window.innerHeight;
	else top=top+50;
	if(newWin)newWin.close();
	
	var width=956;
	if (enableAutoStartDL && autoStart) {
		showPleaseWaitDlg("Please wait while we prepare to download your updates");
		loc += "&autostart=1";
		var iframe = document.body.appendChild(element("iframe", {src:loc}, {display:"none"}));
		iframe.onload = function() {
			setTimeout(function() {
				hidePleaseWaitDlg();
			}, 3000);
		}
	}
	else {
		newWin=window.open(loc, "_blank", "width="+width+", top="+top+", left="+(left+50)+", scrollbars=1, resizable=1, status=0, toolbar=0");
	}
}
function find_displaysize(kb){
	var label="M";
	var style="size_M";
	var size=kb;
	if(kb>999){
		var MB=kb/1024;
		if(Math.round(MB)>999){
			size=(MB/1024).toFixed(2);
			label="G";
			style=" size_G";
		}else{
			size=Math.round(Math.max(1,kb/1024));
			label="M";
			style=" size_M";
		}
	}else{
		style=" size_k";
		label="k";
	}
	return {label:label,size:size,style:style};
}
/*============================== CAR/TRACK SELECT ============================*/

function selectTestCar(key){
	var state=Get_Cookie("panelstate");
	window.location.href=contextpath+"/member/SelectTestCar.do?carid="+key+"&nocache="+new Date().getTime();
}

 

function selectTestCarHandler(req) {
	return function(){
		clearTimeout(IRACING.control_panels.ReusableTimer);
		if (req.readyState == 4) {
			if (req.status == 200) {
				var res = extractJSON(req.responseText);
				decodeAllFields(res);
				if (systemversions) {
					res.img=getCarURL(res,1,res.pattern);
				}
				IRACING.control_panels.rebuild_testingpanel_car(res);
			} else {
				IRACING.control_panels.ReusableTimer = setTimeout(function() {
					IRACING.control_panels.RemoveTestPanelLoading();
					iRacingAlerts("We're having trouble preparing this test track/car combination for you.<br /><br />Please wait a moment, and then try again.<br /><br />If the problem persists, please contact support and mention error <strong>RP-TM-02</strong>.");
				}, 1500);
			}
		}
	}
}

function selectTestCarAjax(carId) {
	var parms={}
	parms['carId'] = carId;
	load(contextpath+"/member/SelectTestCar",parms, selectTestCarHandler);
}


function selectTestTrack(key){
	var state=Get_Cookie("panelstate");
	window.location.href=contextpath+"/member/SelectTestTrack.do?trackid="+key+"&nocache="+new Date().getTime();
}

function selectTestTrackHandler(req){
	return function(){
		clearTimeout(IRACING.control_panels.ReusableTimer);
		if (req.readyState == 4 && req.status == 200) {
			var res = extractJSON(req.responseText);
			decodeAllFields(res);
			IRACING.control_panels.rebuild_testingpanel_track(res);
		} else {
			IRACING.control_panels.ReusableTimer = setTimeout(function() {
				IRACING.control_panels.RemoveTestPanelLoading();
				iRacingAlerts("We're having trouble preparing this test track/car combination for you.<br /><br />Please wait a moment, and then try again.<br /><br />If the problem persists, please contact support and mention error <strong>RP-TM-01</strong>.");
			}, 15000);
		}
	}
}

// For more messaging
var WeatherUIStrings = {
	"TTSessionsDisclaimer"		: "<strong>*</strong>Time Trial sessions will use iRacing default weather"	
};

function selectTestTrackAjax(trackId, weather, TimeOfDay) {
	var parms={};
	parms['trackId'] = trackId;
	if (TimeOfDay == undefined || TimeOfDay == null) {
		TimeOfDay = 0;
	}
	
	// Time Of Day
	parms["timeofday"] = TimeOfDay;
	
	// Now with weather!
	if (weather) {
		parms['weatherType']				= weather.weatherType;
		parms['weatherTempUnits']			= weather.weatherTempUnits;
		parms['weatherTempValue']			= weather.weatherTempValue;
		parms['weatherRelativeHumidity']	= weather.weatherRelativeHumidity;
		parms['weatherFogDensity']			= weather.weatherFogDensity;
		parms['weatherWindDir']				= weather.weatherWindDir;
		parms['weatherWindSpeedUnits']		= weather.weatherWindSpeedUnits;
		parms['weatherWindSpeedValue']		= weather.weatherWindSpeedValue;
		parms['weatherSkies']				= weather.weatherSkies;
	}
	load(contextpath+"/member/SelectTestTrack",parms, selectTestTrackHandler);
}

// Compares two objects
function matchObj(a,b){var c=1;for(var i in a)if(a[i]!=b[i]){c=0;break;}return c;}

// Clones
function cloneObj(a){var b={};for(var i in a)b[i]=a[i];return b;}

// Deep clone
// This works way better, and avoids deep cloning
function deepClone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function setWeatherAjaxHandler(response) {
	return function(){
		if(response.readyState == 4) {
			if(response.status == 200){
				//var res = extractJSON(response.responseText);
				//decodeAllFields(res);
			}
		}
	}
};

function setWeatherAjax(trackID,weather) {
	var params = {};
		params['trackId']					= trackID;
		params['weatherType']				= weather.weatherType;
		params['weatherTempUnits']			= weather.weatherTempUnits;
		params['weatherTempValue']			= weather.weatherTempValue;
		params['weatherRelativeHumidity']	= weather.weatherRelativeHumidity;
		params['weatherFogDensity']			= weather.weatherFogDensity;
		params['weatherWindDir']			= weather.weatherWindDir;
		params['weatherWindSpeedUnits']		= weather.weatherWindSpeedUnits;
		params['weatherWindSpeedValue']		= weather.weatherWindSpeedValue;
		params['weatherSkies']				= weather.weatherSkies;

	load(contextpath+"/member/SelectTestTrack",params, setWeatherAjaxHandler);
};

function selectCarAjaxHandler(req) {
	return function(){
		if(req.readyState == 4) {
			if(req.status == 200) {
				var res = null;
				try {
					res = extractJSON(req.responseText);
				}
				catch (err) {}
				if (res != null && res.rc != 0) {
					iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SCH-001 (" + res.rc + ")</strong>.", {textAlign:"left"});
					return;
				}
				window.location.reload();			
			} else {
				iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SCH-002</strong>.", {textAlign:"left"});
			}
		}
	}
}

function selectCarAjax(seasonId, carId) {
	// Not enough arguments
	if (arguments.length != 2) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SC-001</strong>.", {textAlign:"left"});
		return;
	}
	
	var parms = {
		'seasonId'	: seasonId,
		'carId'		: carId
	}
	
	// Not numbers
	if (isNaN(parseInt(parms['seasonId'])) || isNaN(parseInt(parms['carId']))) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SC-002 (" + parms['seasonId'] + " / " + parms['carId'] + ")</strong>.", {textAlign:"left"});
		return;
	}
	
	// Bad integers
	if (parseInt(parms['seasonId']) <= 0 || parseInt(parms['carId']) <= 0) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SC-003 (" + parms['seasonId'] + " / " + parms['carId'] + ")</strong>.", {textAlign:"left"});
		return;
	}
	
	var Car = getCarById(carId);
	if (Car != null) {
		var ConfirmFunc = function() {
			load(contextpath+"/member/SelectCar", parms, selectCarAjaxHandler);
		}
		var CancelFunc = function() {
			location.reload();
		}
		iRacingConfirm("You are selecting to drive the " + Car.name + ". Is this correct?", {textAlign:"left"}, ConfirmFunc, CancelFunc);
	} else {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SC-004 (" + carId + ")</strong>.", {textAlign:"left"});
		return;
	}
}

function selectSeries(key,view){
	var state=Get_Cookie("panelstate");
	window.location.href=contextpath+"/member/SelectSeries.do?&season="+key+"&view="+view+"&nocache="+new Date().getTime();
}
function selectSeriesCar(key){
	var state=Get_Cookie("panelstate");
	window.location.href=contextpath+"/member/SelectCar.do?&car="+key+"&nocache="+new Date().getTime();
}

function launchFriendsChat(){
   	var loc =contextpath+"/member/FriendChat.do";
   	var friendsWin = window.open(loc, "friendsWin", 'WIDTH=210, HEIGHT=540,resizable=0, scrollbars=0, status=0,toolbar=0'); 
   	friendsWin.focus();
}

/*=========================== INSTRUCTION =================================*/
function launch_sportingcode(loc){
	var sportingCodeWin = null;
	
	$.ajax(contextpath+"/member/GrantRTFMAward").done(function(data) {
		sportingCodeWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
		sportingCodeWin.focus();
		if (Boolean(data) == false) {
			IRACING.control_panels.racepanelMessage("Award Not Granted","We are having trouble granting you the \"Gentlemen &amp; Scholar\" award. Please email <a href=\"mailto:support@iracing.com\">support@iracing.com</a> and we'll make sure it is granted to your account.",false,false,0);
		};
	});
	
	
}
function launch_userguide(loc){
	var userGuideWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	userGuideWin.focus();
}

function launch_unofficialsitepolicy(loc){
	var unofficialsitepolicyWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	unofficialsitepolicyWin.focus();
}

function launch_setupguide(loc){
	var setupguideWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	setupguideWin.focus();
}
function launch_clubpreview(loc){
	var clubpreviewWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	clubpreviewWin.focus();
}
function launch_proseries(loc){
	var proseriesWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	proseriesWin.focus();
}
function launch_codeofconduct(){
	var loc=contextpath+"/codeofconduct_wrapper.jsp";
	var codeofconductWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	codeofconductWin.focus();
}
function launch_quickstart(){
	var loc=contextpath+"/member/instruction/init_qsg.jsp";
	var quickstartWin = window.open(loc, "_blank", 'width=1032, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	quickstartWin.focus();
}

function launch_quickstart_loc(doc_loc){
	var loc=contextpath+doc_loc;
	var quickstartWin = window.open(loc, "_blank", 'width=1032, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	quickstartWin.focus();
}
function launch_seasonSchedule(){
	var scheduleWin = window.open(contextpath + "/member/GetSeasonSchedulePDF", "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	scheduleWin.focus();
}

/*=========================== HELP =======================================*/
function launch_help(){
	//var loc=contextpath+"/member/help.jsp";
	var loc="https://support.iracing.com/support/home";
	//if(js_isFreeSiteMember){
	//	loc = contextpath+"/member/helplite.jsp";
	//}
	//var helpWin = window.open(loc, "_blank", 'width=964, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	var helpWin = window.open(loc, "_blank");
	
	helpWin.focus();
}

function launch_FAQ(){
	//var loc="http://faq.iracing.com";
	var loc="https://support.iracing.com/support/home";
	//var helpWin = window.open(loc, "_blank", 'width=964, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	var helpWin = window.open(loc, "_blank");
	helpWin.focus();
}
function launch_FAQLite(){
	//var loc="http://faq.iracing.com/category.php?id=119";
	var loc="https://support.iracing.com/support/home";
	//var helpWin = window.open(loc, "_blank", 'width=964, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	var helpWin = window.open(loc, "_blank");
	helpWin.focus();
}

function launch_help_nonmember(){
	//var loc=contextpath+"/help.jsp";
	var loc="https://support.iracing.com/support/home";
//	var help_nonmember_Win = window.open(loc, "_blank", 'width=964, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
//	help_nonmember_Win.focus();
	
	var helpWin = window.open(loc, "_blank");
	helpWin.focus();
	
}
function launch_contactus(){
	var loc=contextpath+"/contactus.jsp";
	var contactusWin = window.open(loc, "_blank", 'width=964, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	contactusWin.focus();
}

function launch_contactuslite(){
	var loc=contextpath+"/member/contactuslite.jsp";
	var contactusWin = window.open(loc, "_blank", 'width=964, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	contactusWin.focus();
}

/*=========================== LEGAL =======================================*/
function openPrivacyWin(){
	var loc=contextpath+"/privacypolicy.jsp";
	var privacyWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	privacyWin.focus();
}
function openTermsWin(){
	var loc=contextpath+"/termsofuse.jsp";
	var termsWin = window.open(loc, "_blank", 'width=750, height=600, resizable=1, scrollbars=1, status=0, toolbar=0');
	termsWin.focus();
}
/*=========================== BILLING =====================================*/
function openTax(){
	var loc=contextpath+"/order/tax.jsp";
	var taxWin = window.open(loc, "_blank", 'width=315, height=300, resizable=1, scrollbars=1, status=0, toolbar=0');
	taxWin.focus();
}
function openIrd(type){
	var loc=contextpath+"/order/ird.jsp";
	if (type != null) {
		loc += "?type=" + type;
	}	
	var taxWin = window.open(loc, "_blank", 'width=315, height=350, resizable=1, scrollbars=1, status=0, toolbar=0');
	taxWin.focus();
}

function openIrc(type){
	var loc=contextpath+"/order/irc.jsp";
	if (type != null) {
		loc += "?type=" + type;
	}
	var taxWin = window.open(loc, "_blank", 'width=315, height=350, resizable=1, scrollbars=1, status=0, toolbar=0');
	taxWin.focus();
}

function openSavings(){
	var loc=contextpath+"/order/savings.jsp";
	var savingsWin = window.open(loc, "_blank", 'width=315, height=300, resizable=1, scrollbars=1, status=0, toolbar=0');
	savingsWin.focus();
}

/*=========================== LAUNCH SWF ==================================*/
function launch_swf(divid, objectid, width, height, url, flashvars){
  var a=document.getElementById(divid);
  a.innerHTML=
  	'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0"'+
    'id="'+objectid+'" width="'+width+'" height="'+height+'">'+
    '<param name="movie" value="'+url+'" />'+
    '<param name="quality" value="high" />'+
   	'<param name="loop" value="1" />'+
  	'<param name="FlashVars" value="'+flashvars+'" />'+
   	'<embed src="'+url+'" FlashVars="'+flashvars+'" width="'+width+'" height="'+height+'" loop="1" quality="high" pluginspage="http://www.adobe.com/go/getflashplayer" type="application/x-shockwave-flash" menu="false"></embed>'+
  	'</object>';
}
/*========================== VIEW CART ====================================*/
function viewcart(){
	document.location.href=contextpath+"/member/ViewCart.do";
}
/*========================== CAR URL ======================================*/
function getCarURL(car,size,pattern,nosponsors){
	var src="";
	if(!systemversions){
		var idx=CarListing.objIndexOf(car.id,"id");
		if(idx!=-1){
			src=imageserver+"/"+decodeURIComponent(CarListing[idx].defaultimg)+"/size_"+size+"/car.bmp";
		}
	}else{
		if(car){
			var dirPath = decodeURIComponent(car.dirpath);
			
			// Set up wheels data:
			var wheelString = "";

				var wheelDetails = {"type":"","color":""};
					if ((Number(car.wheelsChrome) >= 0) && (String(car.wheelsColor).length == 6)) {
						wheelString = car.wheelsChrome + "," + car.wheelsColor;
					} else if ((Number(car.wheelChrome) >= 0) && (String(car.wheelColor).length == 6)) {
						wheelString = car.wheelChrome + "," + car.wheelColor;
					};
			
			if(nosponsors)src=localserver+'/car.png?dirpath='+dirPath+'&size='+size+'&pat='+pattern+'&numberslant='+car.numberSlant+'&lic='+MemBean.highestLicColor+'&colors='+car.carColor1+','+car.carColor2+','+car.carColor3+'&car_number='+car.carNum+"&wheels="+wheelString;
			else src=localserver+'/car.png?dirpath='+dirPath+'&size='+size+'&pat='+pattern+'&numberslant='+car.numberSlant+'&lic='+MemBean.highestLicColor+'&colors='+car.carColor1+','+car.carColor2+','+car.carColor3+'&sponsors='+car.sponsor1+','+car.sponsor2+'&numfont='+car.numFont+'&numcolors='+car.numColor1+','+car.numColor2+','+car.numColor3+'&club='+MemBean.clubID+'&car_number='+car.carNum+"&wheels="+wheelString;
		}
	}
	return src;
}
/*========================== BUILD TRACK STATUS ====================================*/
function build_track_status(track,select){
	var status_abs=element("div",{className:"tracks_status"});//absolute
	var status;
	if(track.owned){
		if(track.download){
			var updatelink=status_abs.appendChild(element("a",{href:"javascript:viewUpdates(downloadcontextpath+'/member/GetVersions.do?preselect="+track.pkgID+"&nocache'+new Date().getTime());",title:"Update track"}));
				imgpreload(imageserver+"/member_images/buttons/ptb_download.gif",updatelink,"panel_download_btn");
		}else if(track.update){
			var updatelink=status_abs.appendChild(element("a",{href:"javascript:viewUpdates(downloadcontextpath+'/member/GetVersions.do?preselect="+track.pkgID+"&nocache='+new Date().getTime());",title:"Update track"}));
				imgpreload(imageserver+"/member_images/buttons/ptb_updatesreq.gif",updatelink,"panel_updates_btn");
		}else{
			var teststatus=status_abs.appendChild(element("span"));
				var testlink=teststatus.appendChild(element("a",{title:"Select Test Track"}));
					imgpreload(imageserver+"/member_images/buttons/ptb_select.gif",testlink,"panel_select_btn");
				if(select){
					teststatus.onclick=function(){
						var tracks_select_series=el("tracks_select_series");
						var tracks_select=el("tracks_select");
						if(tracks_select){
							if(tracks_select.parentNode.parentNode==this.parentNode){
								tracks_select.parentNode.removeChild(tracks_select);
								return;
							}
							tracks_select.parentNode.removeChild(tracks_select);
						}
						
						if(tracks_select_series)tracks_select_series.parentNode.removeChild(tracks_select_series);
						select.id="tracks_select";
						setTimeout(function(){select.size=select.options.length},0);
						select.onchange=function(){if(this.selectedIndex)selectTestTrack(this[this.selectedIndex].value);}
						var div=element("div",{},{position:"relative"});
							div.appendChild(select);
						status_abs.appendChild(div);
					}
				}else{
					testlink.href="javascript:selectTestTrack("+track.trackID+")";
				}
			var seriesstatus=status_abs.appendChild(element("span",{className:""}));
				var findserieslink=seriesstatus.appendChild(element("a",{title:"Find a Series"}));
					imgpreload(imageserver+"/member_images/buttons/ptb_findseries.gif",findserieslink,"panel_findseries_btn");
				if(select){
					seriesstatus.onclick=function(){
						var tracks_select_series=el("tracks_select_series");
						var tracks_select=el("tracks_select");
						if(tracks_select_series){
							if(tracks_select_series.parentNode.parentNode==this.parentNode){
								tracks_select_series.parentNode.removeChild(tracks_select_series);
								return;
							}
							tracks_select_series.parentNode.removeChild(tracks_select_series);
						}
						if(tracks_select)tracks_select.parentNode.removeChild(tracks_select);
						select.id="tracks_select_series";
						setTimeout(function(){select.size=select.options.length},0);
						select.onchange=function(){if(this.selectedIndex)document.location.href=contextpath+"/member/Series.do?trackid="+this[this.selectedIndex].value};
						var div=element("div",{},{position:"relative"});
							div.appendChild(select);
						status_abs.appendChild(div);
					}
				}else{
					findserieslink.href=contextpath+"/member/Series.do?trackid="+track.trackID;
				}
		}
	}else{
		if(skusincart.indexOf(track.sku)!=-1){
			status_abs.appendChild(element("span",{innerHTML:"PRICE: $"+track.price,className:"listing_price"}));
			var incartlink=status_abs.appendChild(element("a",{href:"javascript:viewcart()",title:"View Cart"}));
				imgpreload(imageserver+"/member_images/buttons/ptb_viewcart.gif",incartlink,"panel_viewcart_btn");
		} else if ((track.freeWithSubscription == "true") && !MemBean.accountHasBeenPaid) {
			status_abs.appendChild(element("span",{innerHTML:"FREE WITH UPGRADE",className:"listing_price"}));
			var freeWithSubscriptionNode=status_abs.appendChild(element("span"));
			var freeWithSubscription=freeWithSubscriptionNode.appendChild(element("a",{href:"/membersite/account/ChooseNewSubscription.do",id:"freeWithSubscription_"+track.pkgID,title:"UPGRADE"}));
			imgpreload(imageserver+"/member_images/buttons/ptb_upgd.gif",freeWithSubscription,"freeWithSubscription_"+track.pkgID);
		} else {
			status_abs.appendChild(element("span",{innerHTML:"PRICE: $"+track.price,className:"listing_price"}));
			var purchasenode=status_abs.appendChild(element("span"));
			var purchaselink=purchasenode.appendChild(element("a",{href:"javascript:addtocart('sku="+track.sku+"',addtocart_tracks_handler);",title:"Purchase Track"}));
				imgpreload(imageserver+"/member_images/buttons/ptb_addtocart.gif",purchaselink,"panel_addtocart_btn");
			addtocart_arr.push({target:purchasenode,sku:track.sku});
		}
	}
	return status_abs;
}

/*========================== BUILD CAR STATUS ====================================*/
function build_car_status(car,select){
	var status_abs=element("div",{className:"cars_status"});
	var status;
	
	if(car.owned){
		if(car.download){
			var updatelink=status_abs.appendChild(element("a",{href:"javascript:viewUpdates(downloadcontextpath+'/member/GetVersions.do?preselect="+car.pkgID+"&nocache'+new Date().getTime());",title:"Update Car"}));
			imgpreload(imageserver+"/member_images/buttons/ptb_download.gif",updatelink,"panel_download_btn");
		}else if(car.update){
			var updatelink=status_abs.appendChild(element("a",{href:"javascript:viewUpdates(downloadcontextpath+'/member/GetVersions.do?preselect="+car.pkgID+"&nocache'+new Date().getTime());",title:"Update Car"}));
			imgpreload(imageserver+"/member_images/buttons/ptb_updatesreq.gif",updatelink,"panel_updates_btn");
		}else{
			var teststatus=status_abs.appendChild(element("span"));
				var testlink=teststatus.appendChild(element("a",{title:"Select Test Car"}));
				imgpreload(imageserver+"/member_images/buttons/ptb_select.gif",testlink,"panel_select_btn");

				if(select){
					teststatus.onclick=function(){
						var cars_select_series=el("cars_select_series");
						var cars_select=el("cars_select");
						if(cars_select){
							if(cars_select.parentNode.parentNode==this.parentNode){
								cars_select.parentNode.removeChild(cars_select);
								return;
							}
							cars_select.parentNode.removeChild(cars_select);
						}
						
						//if(cars_select)cars_select.parentNode.removeChild(cars_select);
						if(cars_select_series)cars_select_series.parentNode.removeChild(cars_select_series);
						select.id="cars_select";
						setTimeout(function(){select.size=select.options.length},0);
						select.onchange=function(){if(this.selectedIndex)selectTestCar(this[this.selectedIndex].value);}
						var div=element("div",{},{position:"relative"});
							div.appendChild(select);
						status_abs.appendChild(div);
					}
				}else{
					testlink.href="javascript:selectTestCar("+car.carID+")";
				}
			var seriesstatus=status_abs.appendChild(element("span",{className:""}));
				var findserieslink=seriesstatus.appendChild(element("a",{title:"Find a Series"}));
				imgpreload(imageserver+"/member_images/buttons/ptb_findseries.gif",findserieslink,"panel_findseries_btn");

				if(select){
					seriesstatus.onclick=function(){
						var cars_select_series=el("cars_select_series");
						var cars_select=el("cars_select");
						if(cars_select_series){
							if(cars_select_series.parentNode.parentNode==this.parentNode){
								cars_select_series.parentNode.removeChild(cars_select_series);
								return;
							}
							cars_select_series.parentNode.removeChild(cars_select_series);
						}
						if(cars_select)cars_select.parentNode.removeChild(cars_select);
						select.id="cars_select_series";
						setTimeout(function(){select.size=select.options.length},0);
						select.onchange=function(){if(this.selectedIndex)document.location.href=contextpath+"/member/Series.do?carid="+this[this.selectedIndex].value};
						var div=element("div",{},{position:"relative",left:"152px"});
							div.appendChild(select);
						status_abs.appendChild(div);
					}
				}else{
					findserieslink.href=contextpath+"/member/Series.do?carid="+car.carID;
				}
			//status_abs.appendChild(element("div",{className:"clearboth"}));
		}
	}else{ // Not owned
		// If in the cart already
		if(skusincart.indexOf(car.sku)!=-1){
			status_abs.appendChild(element("span",{innerHTML:"PRICE: $"+car.price,className:"listing_price"}));
			var incartlink=status_abs.appendChild(element("a",{href:"javascript:viewcart()",title:"View Cart"}));
			imgpreload(imageserver+"/member_images/buttons/ptb_viewcart.gif",incartlink,"panel_viewcart_btn");
		} else if ((car.freeWithSubscription == "true") && !MemBean.accountHasBeenPaid) {
			status_abs.appendChild(element("span",{innerHTML:"FREE WITH UPGRADE",className:"listing_price"}));
			var freeWithSubscriptionNode=status_abs.appendChild(element("span"));
			var freeWithSubscription=freeWithSubscriptionNode.appendChild(element("a",{href:"/membersite/account/ChooseNewSubscription.do",id:"freeWithSubscription_"+car.pkgID,title:"UPGRADE"}));
			imgpreload(imageserver+"/member_images/buttons/ptb_upgd.gif",freeWithSubscription,"freeWithSubscription_"+car.pkgID);
		}else{
			status_abs.appendChild(element("span",{innerHTML:"PRICE: $"+car.price,className:"listing_price"}));
			var purchasenode=status_abs.appendChild(element("span"));
			var purchaselink=purchasenode.appendChild(element("a",{href:"javascript:addtocart('sku="+car.sku+"',addtocart_cars_handler);",title:"Purchase Car"}));
			imgpreload(imageserver+"/member_images/buttons/ptb_addtocart.gif",purchaselink,"panel_addtocart_btn");
			addtocart_arr.push({target:purchasenode,sku:car.sku});
		}
		status_abs.appendChild(element("div",{className:"clearboth"}));
	}
	return status_abs;
}

/*========================== LAUNCH CHAT ====================================*/
function launchchat_ajax_handler(req){
	return function(){
		if(req.readyState == 4) {
	  	if(req.status == 200){
	  		eval("var chatsvr="+req.responseText.replace(/\+/g," ")+";");
	  		if(chatsvr==-1)iRacingAlerts("There are no chat servers available at this time.");
	  		else document.location.href=chathref+"&chatsvr="+chatsvr;
	  	}
		}
	}
}
function launchchat_ajax(room){
	if(!systemversions){
		iRacingAlerts("Chat is not available when your system is not in service.");
	}else if(overallUpdateRequired){
		iRacingAlerts("Chat is not available until you update your system software.");
	}else{
		load(contextpath+"/member/GetChatServerInfo?room="+room,null,launchchat_ajax_handler);
	}
}	
/*========================= ADD TO CART ====================================*/
function addtocart(sku,handler){
	try{
		if(UI){
			UI.createPreloader('ui');	
		}		
	}catch(e){
		console.info(e);
	}
	if (typeof(ShowDataIsRetrieving) == "function") ShowDataIsRetrieving();
	if(typeof(handler)=="string")handler=this[handler];
	var res = load(contextpath+"/member/OrderAddItemToCart?"+sku,null,handler);
	if (typeof(HideDataIsRetrieving) == "function") HideDataIsRetrieving();
	return res;
}
function update_content_addtocart_targets_carstracks(cartskus){
	el("siteutils_cart").style.display="inline";
	if(addtocart_arr){
	for(var i=0;i<addtocart_arr.length;i++){
	  var item=addtocart_arr[i];
	  if(cartskus.indexOf(item.sku)!=-1){
			var incartlink=element("a",{href:"javascript:viewcart()",title:"View Cart"});
				imgpreload(imageserver+"/member_images/buttons/ptb_viewcart.gif",incartlink,"panel_viewcart_btn");
			item.target.replaceChild(incartlink,item.target.childNodes[0]);
	  }
	}
	}
	update_content_addtocart_racepanel(cartskus);
}
function update_content_addtocart_targets_series(cartskus){
	el("siteutils_cart").style.display="inline";
	if(addtocart_arr){
	for(var i=0;i<addtocart_arr.length;i++){
	  var item=addtocart_arr[i];
	  if(cartskus.indexOf(item.sku)!=-1){
			item.target.innerHTML="VIEW CART";
			item.target.href=contextpath+"/member/ViewCart.do";
			item.target.title="View Cart";
	  }
	}
	}
	update_content_addtocart_racepanel(cartskus);
}
function update_content_addtocart_racepanel(cartskus){
	if(racingpaneldata && racingpaneldata.skus_arr.length){
		for(var i=0;i<racingpaneldata.content_arr.length;i++){
	  	var item=racingpaneldata.content_arr[i];
	  	if(cartskus.indexOf(item.sku)!=-1){
	  		item.target.innerHTML="In Cart";
	  		item.target.href=contextpath+"/member/ViewCart.do";
	  		item.target.title="View Cart";
	  	}
		}
	  var incart=1;
	  for(var i=0;i<racingpaneldata.skus_arr.length;i++){
	  	var sku=racingpaneldata.skus_arr[i];
	  	if(cartskus.indexOf(sku)==-1)incart=0;
	  }
	  if(incart){
	  	racingpaneldata.addtocart_target.parentNode.replaceChild(IRACING.control_panels.viewcart,racingpaneldata.addtocart_target);
	  }
	}
}
/*========================= DHTML ===================================*/
function showhide(a,b){
	return function(){
		a.style.display="inline";
		b.style.display="none";
	};
}
function assign_states_status(a){
	var div=a.getElementsByTagName("div")[0];
	function shift(a,top){return function(){a.style.top=top+"px";};}
	a.onmouseover=shift(div,-29);
	a.onmouseout=shift(div,0);
	a.onmousedown=shift(div,-58);
}
function launchEventResult(id,custid){
	var useWidth = Math.min(parseInt(screen.availWidth * .90), 1250);
	var useHeight = parseInt(screen.availHeight * .90);
	var loc=contextpath+"/member/EventResult.do?&subsessionid="+id+"&custid="+custid;
	var eventWin=window.open(loc, "_blank", 'width=' + useWidth + ', height=' + useHeight + ', resizable=1, scrollbars=1, status=0, toolbar=0');
	eventWin.focus();
}
/*========================= Panel Listings ===================================*/
function panelover(img){
	return function(){
		this.style.background="transparent url('"+img+"') 0 -115px no-repeat";
	};
}
function panelout(img){
	return function(){
		this.style.background="transparent url('"+img+"') no-repeat";
	};
}
/*========================== CSS Sprite Utility ===============================*/
function spriteShift(target,top,left){
	target.style.top=top+"px";
	target.style.left=left+"px";
}


/*========================= Browser Size Utility ==============================*/
/**
 * Returns the current size of the browser window
 */
function getWindowSize() {
  var myWidth = 0, myHeight = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    myWidth = window.innerWidth;
    myHeight = window.innerHeight;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    myWidth = document.documentElement.clientWidth;
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
   	//IE 4 compatible
    myWidth = document.body.clientWidth;
    myHeight = document.body.clientHeight;
  }
  return [myWidth, myHeight];
}

/*========================= Element Position Utility ==============================*/
/**
 * Returns the absolute location of the given element
 */
function findPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [curleft,curtop];
}

/**
 * Returns the current size of the browser window
 */
function getWindowSize() {
  var myWidth = 0, myHeight = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    myWidth = window.innerWidth;
    myHeight = window.innerHeight;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    myWidth = document.documentElement.clientWidth;
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
   	//IE 4 compatible
    myWidth = document.body.clientWidth;
    myHeight = document.body.clientHeight;
  }
	return [myWidth, myHeight];
}

/**
 * Returns the index of a given value in a select element's options array
 * 
 */
getSelectOptionIndex=function(select, lookFor){var index=-1;for(var i=select.options.length;i--;)if(select.options[i]&&(select.options[i].value==lookFor)){index=i;break;}return index;}

selectOption=function(select, value) {
	var ndx = 0;
	while (select && select.options && ndx < select.options.length) {
		var option = select.options[ndx];
		if (option.value == value) {
			if (select.selectedIndex != ndx) {
				select.selectedIndex = ndx;
			}
		}
		ndx++;
	}	
}

function getSelectedOption(select) {
	if (!select) {
		return null;
	}
	var ndx = select.selectedIndex;
	if (ndx < 0) {
		return null;
	}
	if (ndx >= select.options.length) {
		return null;
	}
	return select.options[ndx];
}

function selectHasOptionWithName(select, name) {
	var ndx = 0;
	while (select && select.options && ndx < select.options.length) {
		var option = select.options[ndx];
		if (option.text == name) {
			return true;
		}
		ndx++;
	}	
	return false;
}

function selectHasOptionWithValue(select, value) {
	var ndx = 0;
	while (select && select.options && ndx < select.options.length) {
		var option = select.options[ndx];
		if (option.value == value) {
			return true;
		}
		ndx++;
	}	
	return false;
}

/**
* This doesn't do anything but I use it to force asynchronous behavior when sending preferences to the server
* 
*/
function dummyAjaxHandler(req) {
	return function(){
		if (req.readyState==4) {
			if (req.status==200){
	  		}else{
	  		}
		}
	}
}

function sendMPToHost(name, value, handler) {
	var url = contextpath+"/member/SetMemberPreferences";   
	var parms = Object();
	parms[name] = value;
	load(contextpath+"/member/SetMemberPreferences", parms, (handler ? handler : dummyAjaxHandler));		
}

function sendMPsToHost(parms, handler) {
	var url = contextpath+"/member/SetMemberPreferences";   
	load(contextpath+"/member/SetMemberPreferences", parms, (handler ? handler : dummyAjaxHandler));		
}

function sendMemberPreferenceToHost(name, value, handler) {
	var url = contextpath+"/member/SetMemberPreferences";   
	var parms = Object();
	parms[name] = value;
	load(contextpath+"/member/SetMemberPreferences", parms, (handler ? handler : dummyAjaxHandler));		
}

// We can give this CSV items to get multiples! (foo,bar,derp)
function getMemberPreference(preferenceNamesCSV,defaultValueCSV) {
	returnOBJ = {};
	if (preferenceNamesCSV) {
		$.getJSON(contextpath+"/member/GetMemberPreference?preferenceName="+preferenceNamesCSV+"&defaultValue="+defaultValueCSV).done(function(response) {
			return response;
		}).error(function() {
			return returnOBJ;
		});
	};
};

function strcmp(str1, str2) {
	return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
}

function removeAllChildren(e) {
	if (!e) {
		return false;
	}
    if(typeof(e)=='string') {
        e = xGetElementById(e);
    }
    while (e.hasChildNodes()) {
        e.removeChild(e.firstChild);
    }
    return true;
}

function truncTwoDecPts(value, numPts) {
	var pts = numPts;
	if (!pts) {
		pts = 2;
	}
	var mult = Math.pow(10, pts);
	try {
		var newValue = parseFloat(value);
		newValue = parseInt(newValue * mult) / mult;
		return newValue;
	}
	catch (err) {
	}
	return 0;	
}

function getLocalDate(timems){
	var d=new Date(timems);
	var mo=d.getMonth()+1;
	if(mo<10)mo="0"+mo;
	var day=d.getDate();
	if(day<10)day="0"+day;
	var ymd=d.getFullYear()+"."+mo+"."+day;
	var ap=d.getHours()>11?"p":"a";
	var h=d.getHours();
	if(h>12)h-=12;
	if(h==0)h=12;
	var m=d.getMinutes();
	if(m<10)m="0"+m;
	var hm=h+":"+m+ap;
	return {ymd:ymd,hm:hm}
}
function getUTCDate(timems){
	var d=new Date(timems);
	var mo=d.getUTCMonth()+1;
	if(mo<10)mo="0"+mo;
	var day=d.getUTCDate();
	if(day<10)day="0"+day;
	var ymd=d.getUTCFullYear()+"."+mo+"."+day;
	var h=d.getUTCHours();
	var m=d.getUTCMinutes();
	if(m<10)m="0"+m;
	var hm=h+":"+m;
	return {ymd:ymd,hm:hm}
}

function trim(str) {
	var	str = str.replace(/^\s\s*/,''),
		ws = /\s/,
		i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0,i+1);
}

/**
 * Beware - this seems to hang on some objects and should only be used for debugging
 */
function traverseObject(obj) {
    for (i in obj) {
    	if (typeof obj[i] == 'object') {
    		traverseObject(obj[i]);
    	}
    }
}

/**
 * Creates and returns a clone of an object (o).  It takes a fieldmap as a parameter and uses this to change the field
 * names in the cloned object
 * 
 * @param o
 * @param fieldmap
 * @return
 */
function cloneObject(o, fieldmap) {	
	/**
	 * If the var passed in isn't an object we can just return it b/c it's a primitive type
	 */
    if(typeof(o) != 'object') {
    	return o;
    }
    if(o == null) {
    	return o;
    }
  
    
    /**
     * Arrays are objects but they need to be dealt with carefully.  I found that if I clone an array just like I would any other object the
     * resulting array won't really be an array.  It will look kinda like an array but it won't work properly (e.g. no length property and I didn't
     * stick around long enough to find out what else may be wrong with them).  My workaround for this is to loop through the source array creating 
     * clones of each object found and pushing
     * them onto a new array.
     */
    var newO;
    if (o instanceof Array) {
    	newO = [];
    	var i = 0;
    	while (i < o.length) {
    		newO.push(cloneObject(o[i++], fieldmap));
    	}
    	return newO;
    }
    
    /**
     * This code will clone an object (that isn't an array) by first creating an empty object and then looping through the source object
     * and adding clones of each object we find to the target object.  This is also the place where the field name translation takes
     * place.  When we put the cloned object into the target object we will see if it's name is represented in the fieldMap.  If so we'll
     * use that name rather than the original name from the source object.
     */
    newO = new Object();
    for(var i in o) {
    	var fieldName = i;
    	if (fieldmap && fieldmap[i]) {
    		fieldName = fieldmap[i];
    	}
    	newO[fieldName] = cloneObject(o[i], fieldmap);
    }
    return newO;
}

/**
 * 
 * @param s
 * @return
 */
function decodeUTF8( s )
{
  return decodeURIComponent( escape( s ) );
}

/**
 * Extends decodeURIComponent by also replacing +'s with spaces
 * 
 * @param buf
 * @return
 */
function decodeURIComponentEx(buf) {
	if (!buf) {
		return buf;
	}
	
	var result = buf;
	try {
		
		result = decodeURIComponent(("" + buf).replace(/\+/g," "));
		}
	
	catch (err) {
		logToConsole("error decoding " + buf);
		logToConsole(err);
	}
	return result;
}

/**
 * Takes json data, uncompresses it (if necessary) and returns an eval'ed object
 *  
 * 
 * @param jsonData
 * @return
 */
function extractJSON(jsonData) {
	// Null
	if ((!jsonData) || (jsonData == null)) return {};
	
	// Empty
	try {
		if (Object.keys(jsonData).length == 0) return {};
	} catch(e) {}
	
	// Remove + spaces
	var returnOBJ = String(jsonData).replace(/\+/g," ");
	if (!returnOBJ) return {};
	
	// Might not be JSON
	if (typeof(jsonData) == "object") {
		var d;
		eval("d = new Object("+jsonData+")");
		return d;
	}
	
	// Not compressed?
	if (!jsonData.m || !jsonData.d) {
		var obj = {};
		try {
			obj = JSON.parse(String(jsonData).replace(/\+/g," "));
		} catch (e) {
			var d;
			eval("d = new Object("+jsonData+")");
			return d;
		}
		
		if (obj.m && obj.d) {
			return cloneObject(obj.d,obj.m);
		} else {
			return obj;
		}
	} else {
		try {
			return cloneObject(jsonData.d,jsonData.m);
		} catch (e) {
			return {};
		}
	}
}

/**
 * Loops through all of the non-numeric properties of this object and runs them through decodeURIComponentEx
 * 
 * @param obj
 * @return
 */
function decodeAllFields(obj) {
	for (prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			if (typeof(obj[prop]) == "object") {
				decodeAllFields(obj[prop]);
			}
			else if (isNaN(obj[prop])) {
				obj[prop] = decodeURIComponentEx(obj[prop]);
			}
		}
	}
	return obj;
}

function selectCarHandler(req, forwardTo){
	return function(){
		if(req.readyState == 4) {
			if(req.status == 200){
				var res = extractJSON(req.responseText);
				if (res.rc != 0) {
					el("goButton").style.cursor = "default";				
					el("modalCarSelErr").innerHTML = "Error selecting car.  If the problem persists contact customer support and provide error code " + res.rc;
					el("modalCarSelErr").style.display = "block";
					return;
				} 										
				var state=Get_Cookie("panelstate");
				state=state|1;
				if(!(state&2))state=state|8;
				Set_Cookie("panelstate",state);
				window.location.href=forwardTo;
			}
		}
	}
}
 

function handleCB(e) {
	var checkbox = null;
	if ($(e).is(".control-checkbox-check")) {
		checkbox = e;
	}
	else {
		checkbox = $(e).prev(".control-checkbox-check")[0];
	}	
	var checkBoxOff = "0px 0px";
	var checkBoxOn = "0px -12px";
	var bgPos = checkbox.style.backgroundPosition;
	if (bgPos == "" || bgPos == checkBoxOff) {
	 	checkbox.style.backgroundPosition = checkBoxOn;
	 	return true;
	}
	else {
	 	checkbox.style.backgroundPosition = checkBoxOff;
	 	return false;
	}					
}

function removeMCExcluded(seriesid) {
	try {
		if (multiClassSettings && multiClassSettings['carpopup.excluded_series']) {
			var es = [];
			es = multiClassSettings['carpopup.excluded_series'].split(",");
			var ndx = 0;
			while (es && ndx < es.length) {
				if (es[ndx] == seriesid) {
					es.splice(ndx, 1);
					continue;
				}
				ndx++;
			} 		
			multiClassSettings['carpopup.excluded_series'] = es.join(",");
			sendMemberPreferenceToHost("multiclass.carpopup.excluded_series", multiClassSettings['carpopup.excluded_series']);		
		}
	}
	catch (err) {
	}
}

function addMCExcluded(seriesid) {
	try {
		var es = [];
		if (multiClassSettings && multiClassSettings['carpopup.excluded_series']) {
			es = multiClassSettings['carpopup.excluded_series'].split(",");
		}	
		var found = false;
		var ndx = 0;
		while (ndx < es.length) {
			if (es[ndx++] == seriesid) {
				found = true;
				break;
			}
		}
		if (!found) {
			es.push(seriesid);
		}
		multiClassSettings['carpopup.excluded_series'] = es.join(",");	
		sendMemberPreferenceToHost("multiclass.carpopup.excluded_series", multiClassSettings['carpopup.excluded_series']);		
	}
	catch (err) {
	}
}

function removeCSDLink(parent, seriesId) {
	removeAllChildren(parent);
	parent.appendChild(element("span", {innerHTML:"WARNING:  You will not be prompted to select a car the next time you register for this series.<br>"}, {fontSize:"7pt"}));
	var link = parent.appendChild(element("a", {innerHTML:"Click here ", href:"javascript:void(0)"}, {fontSize:"7pt"}));
	link.seriesId = seriesId;
	link.onclick = function() {
		removeMCExcluded(this.seriesId);
		addCSDLink(this.parentNode, this.seriesId);
	}
	parent.appendChild(element("span", 
			{innerHTML:"if you would like to re-enable this popup."}, {fontSize:"7pt"}));
	
}

function addCSDLink(parent, seriesId) {
	removeAllChildren(parent);
	var link = parent.appendChild(element("a", {innerHTML:"Click here ", href:"javascript:void(0)"}, {fontSize:"7pt"}));
	link.seriesId = seriesId;
	link.onclick = function() {
		addMCExcluded(this.seriesId);
		removeCSDLink(this.parentNode, this.seriesId);
	}
	parent.appendChild(element("span", 
			{innerHTML:"if you do not want to be prompted to select a car when you register for future sessions in this series.  If you do this you can re-enable the popup from the general tab on the settings panel."}, {fontSize:"7pt"}));

}

/**
 * This is used in the race panel when there is a discrepancy between the track being displayed in the race panel and the track that is associated with
 * a "join session" link in the race panel.  The problem can arise when we are close to a week cutover (and thus a track cutover).
 * 
 * @param track
 * @param session
 * @return
 */
function confirmRacePanelTrack(session, isOP, carId) {
	/** 
		Create and initialize a div to hold our dialog
	 */
	var div = el("confirmTrackDlg");
	if (!div) {
		var bgURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-background.gif)";
		div = document.body.appendChild(element("div", {id:"confirmTrackDlg", className:"jqmWindow"}, {border:"1px solid black", height:"220px", zbackgroundImage:bgURL, textAlign:"left"}));
		$('#confirmTrackDlg').jqm({modal:true});
	}
	
	/**
		Populate our dialog with content (first remove any children in case we are coming back in here multiple times)
	 */			
	removeAllChildren(div);
	var container = div.appendChild(element("div", {}, {margin:"0px", padding:"0px", marginLeft:"20px", marginTop:"10px"}));
	
	var title = container.appendChild(element("div", {innerHTML:"CONFIRM YOUR TRACK", className:"euro"}, {position:"relative", width:"560px", height:"30px", lineHeight:"30px", backgroundColor:"black", color:"white", textAlign:"center", fontWeight:"bold"}));
		var closeButton = title.appendChild(element("img", {className:"pointer", src:imageserver+"/member_images/multiclass/modal/modal-x.jpg"}, {position:"absolute", top:"8px", right:"5px"}));
		closeButton.onclick = function() {
			$("#confirmTrackDlg").jqmHide();
		}
	
	var sessionTrack = getTrackById(session.trackid);
	var div2 = container.appendChild(element("div", {}, {width:"538px", height:"148px", padding:"10px", border:"1px solid #aaaaaa", backgroundColor:"#eeeeee", margin:"0px"}));
		div2.appendChild(element("div", {innerHTML:"The session you selected will run at <b>" + sessionTrack.name + "</b>.  This is different from what is currently displayed in the race panel.  This can happen when we are close to a race week cutover.<br><br>Would you like to register for the session at <b>" + sessionTrack.name + "</b>?"}, {fontSize:"8pt", textAlign:"center"}));
				
		var goURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-go.gif)";
		var goButton = div2.appendChild(element("div", {id:"goButton", className:"floatleft pointer"}, {width:"67px", height:"23px", backgroundImage:goURL, marginTop:"13px", marginLeft:"185px", marginBottom:"10px"}));
		goButton.onclick = function() {
			$("#confirmTrackDlg").jqmHide();
			if (isOP) {
				selectOpenSession("racepanel", session.subsessionid, session.seasonid, null, carId);
			}
			else {
				selectSession("racepanel", session.sessionid, session.seasonid, carId);
			}
		}

		var cancelURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-cancel.gif)";
		var cancelButton = div2.appendChild(element("div", {className:"floatleft pointer"}, {width:"90px", height:"23px", backgroundImage:cancelURL, marginTop:"13px", marginLeft:"10px", marginBottom:"10px"}));
		cancelButton.onclick = function() {
			$("#confirmTrackDlg").jqmHide();
		}

		Cufon.replace(".euro");		

	/** show the dialog **/
	$(div).jqmShow();
		
}

function selectSession(context, sessionId, seasonId, carId) {
	//console.log(arguments)
	
	// There's either 3 or 4 args
	if (arguments.length != 4 && arguments.length != 3) {
		console.info(arguments)
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SS-001</strong>.", {textAlign:"left"});
		return;
	}
	
	if (!String(context).length) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SS-002</strong>.", {textAlign:"left"});
		return;
	}
	
	if (isNaN(sessionId) || parseInt(sessionId) <= 0) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SS-003</strong>.", {textAlign:"left"});
		return;
	}
	
	if (isNaN(seasonId) || parseInt(seasonId) <= 0) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SS-004</strong>.", {textAlign:"left"});
		return;
	}
	
	if (arguments.length == 4 && (isNaN(carId) || parseInt(carId) <= 0)) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SS-005</strong>.", {textAlign:"left"});
		return;
	}
	
	/** 
	 *	The first thing we need to do is get the season object
	 */
	var season = null;
	if (seasonId) {
		/**
		 * 	They passed in a seasonId so just do a simple lookup into SeasonListing
	 	 */
		season = getSeasonById(seasonId);		
		if (!season) {
			return;
		}
	}
	else {
		/**
		 * They didn't pass in a seasonId so see if we can figure out the season from the sessionId
		 */
		season = getSeasonBySessionId(sessionId);
		if (!season) {
			return;
		}
	}
	
	// look up the rules, if there are any
	var seriesIDValid = (parseInt(season.seriesid) > 0)
	var selectedSeriesID = (seriesIDValid) ? season.seriesid : 0;
	var seriesRules = checkForSeriesAcceptance(selectedSeriesID);
	
	// If there's rules, we see if the preference is set, and if it's valid
	// If not, we show the accept modal
	if (!$.isEmptyObject(seriesRules)) {
		
		// This is the lookup key for the member preference
		var preferenceKey = String("accepted_terms_seriesid_" + selectedSeriesID);
		
		// Default
		var lastAccepted = -1;
		
		// See if it's in prefslisting, then convert it to a number
		if (MemPrefsListing[preferenceKey] !== undefined && isString(MemPrefsListing[preferenceKey]) && MemPrefsListing[preferenceKey].length) {
			lastAccepted = parseInt(MemPrefsListing[preferenceKey]);
		}
		
		// {bool} have they accepted?
		var hasAcceptedTerms = (lastAccepted > seriesRules.as_of);
		
		/**
		 * Look in MemPrefsListing for it being overwritten in the page (this would be set by the page or by the result of the lookup func)
		 * If it's there, compare the values
		 * 
		 * If it's valid, just continue
		 * If it's invalid, do things
		 * 
		 */
		
		// If the found value or default value isn't valid
		if (!hasAcceptedTerms) {
			
			// If it was -1 we don't have it
			if (lastAccepted === -1) {
				
				// Look up the preference, set it, then reinvoke the function
				getMemberPreferenceAjax(
					preferenceKey, // pref name
					"0", // default value
					function(response) {
						var errorsInResponse = false;
						if (!$.isEmptyObject(response) && isString(response[preferenceKey]) && response[preferenceKey].length) {
							
							var formattedPrefValue = String(response[preferenceKey]);
							
							// Set the preference
							MemPrefsListing[preferenceKey] = formattedPrefValue;
							
							// Reinvoke the function
							if (carId) {
								selectSession(context, sessionId, seasonId, carId);
							} else {
								selectSession(context, sessionId, seasonId);
							}
							
							
						} else {
							errorsInResponse = true;
						}
						
					},
					function(err) {
						iRacingAlerts("Errors Registering or Session (TRS-02)");
						console.warn(err)
					}
				);
				
			}
			// Otherwise we just prompt
			else {
				var boundFunc = null;
				if (carId) {
					boundFunc = selectSession.bind(this, context, sessionId, seasonId, carId);
				} else {
					boundFunc = selectSession.bind(this, context, sessionId, seasonId);
				}
				
				showSeriesTermsAcceptModal(
					seriesRules,
					boundFunc
				);
			}
			
			// Prevent going further
			return false;
		}
	}
	
	
	/**
	 * If this is a single car session we can go straight to the registration
	 */
	if (season.cars.length == 1 || context == "racepanel") {
		var state=Get_Cookie("panelstate");
		state=state|1;
		if(!(state&2))state=state|8;
		Set_Cookie("panelstate",state);
		var redirectTo = contextpath+"/member/RegisterForSession.do?&sessionid="+sessionId+"&regloc="+context+"&nocache="+new Date().getTime();
		if (context == "racepanel" && carId) {
			redirectTo += "&carId=" + carId;
		}
		window.location.href=redirectTo;
		return;
	}
	
	var pref = multiClassSettings['carpopup.excluded_series'];
	if (pref) {
		var ids = pref.split(",");
		var ndx = 0;
		while (ids && ndx < ids.length) {
			if (ids[ndx] == season.seriesid) {
				var state=Get_Cookie("panelstate");
				state=state|1;
				if(!(state&2))state=state|8;
				Set_Cookie("panelstate",state);
				window.location.href=contextpath+"/member/RegisterForSession.do?&sessionid="+sessionId+"&regloc="+context+"&nocache="+new Date().getTime();
				return;				
			}
			ndx++;
		}
	}
		
	/** 
		Create and initialize a div to hold our dialog
	 */
	var div = el("selectCarDlg");
	if (!div) {
		var bgURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-background.gif)";
		div = document.body.appendChild(element("div", {id:"selectCarDlg", className:"jqmWindow"}, {backgroundImage:bgURL, textAlign:"left"}));
		$('#selectCarDlg').jqm({modal:true});
	}

	/**
		Populate our dialog with content (first remove any children in case we are coming back in here multiple times)
	 */			
	removeAllChildren(div);
	
	var container = div.appendChild(element("div", {}, {margin:"0px", padding:"0px", marginLeft:"20px", marginTop:"10px"}));

	var titleURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-select-a-car.gif)";
	var title = container.appendChild(element("div", {}, {width:"560px", height:"30px", backgroundImage:titleURL, textAlign:"right"}));
		var closeButton = title.appendChild(element("img", {src:imageserver+"/member_images/multiclass/modal/modal-cancel.jpg"}, {marginTop:"8px", marginRight:"8px"}));
		closeButton.onclick = function() {			
			$(div).hide();
			$("#selectCarDlg").jqmHide();
		}
		closeButton.onmouseover = function() {
			this.style.cursor = "pointer";
		}
		closeButton.onmouseout = function() {
			this.style.cursor = "default";
		}
	
	var div2 = container.appendChild(element("div", {}, {width:"560px", padding:"10px", border:"1px solid #aaaaaa", backgroundColor:"#eeeeee", margin:"0px"}));
		div2.appendChild(element("div", {innerHTML:"This is a multi-car session.  Select the car you would like to drive and press the 'Go' button."}, {fontSize:"8pt", textAlign:"center"}));
			var carSelect = div2.appendChild(element("select", {id:"carSelect"}, {width:"300px", fontSize:"8pt", cssFloat:"left", styleFloat:"left", marginTop:"15px", marginLeft:"74px"}));
			var y = 0;		
			while (y < season.carclasses.length) {
				var carclass = season.carclasses[y++];
				var z = 0;
				while (carclass && carclass.carsinclass && z < carclass.carsinclass.length) {
					var car = carclass.carsinclass[z++];
					if (ownsCar(car.id)) {
						var label = decodeURIComponent(carclass.shortname) + " : " + decodeURIComponent(car.name); 
						carSelect.appendChild(element("option", {innerHTML:label, value:car.id}, {fontSize:"8pt"}));
					}
				}
			}
			selectOption(carSelect, racingpaneldata.car.id);				
		
		var goURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-go.gif)";
		var goButton = div2.appendChild(element("div", {id:"goButton"}, {width:"67px", height:"23px", backgroundImage:goURL, cssFloat:"left", styleFloat:"left", marginTop:"13px", marginLeft:"25px", marginBottom:"10px"}));
		goButton.carSelect = carSelect;
		goButton.seasonId = season.seasonid;
		goButton.processing = false;
		goButton.onclick = function() {
			$(div).hide();
			$("#selectCarDlg").jqmHide();
			el("modalCarSelErr").innerHTML = "";
			el("modalCarSelErr").style.display = "none";
			this.style.cursor = "wait";
			var parms={}
			parms['carId'] = this.carSelect.value;
			parms['seasonId'] = this.seasonId;
			
			iRacingConfirm("You have selected to register with the "+$('#carSelect option:selected').text()+". Is this correct?", {textAlign:"left"}, 
			function(){
				if (this.processing) {
					return;
				}
				this.processing = true;

				if(this.carSelect.value){
					var gotoURL = contextpath+"/member/RegisterForSession.do?&sessionid="+sessionId+"&carId="+this.carSelect.value+"&regloc="+context+"&nocache="+new Date().getTime();
					var buf = load(contextpath+"/member/SelectCar",parms, selectCarHandler, gotoURL);				
				}else{
					iRacingAlerts("<strong>Something went wrong!</strong><br /><br />Please refresh the page and try again.", {textAlign:"left"});
				}	
			}, 
			function(){
				$(div).show();
				$(div).jqmShow();
			});
		}
		goButton.onmouseover = function() {
			this.style.cursor = "pointer";
		}
		goButton.onmouseout = function() {
			this.style.cursor = "default";
		}
		
		div2.appendChild(element("div", {id:"modalCarSelErr"}, {clear:"both", fontSize:"7pt", width:"535px", color:"red", display:"none", textAlign:"center"}));
		
		var hideDiv = div2.appendChild(element("div", {}, {clear:"both", position:"relative", marginLeft:"10px"}));		
			addCSDLink(hideDiv, season.seriesid);
			
			
	/** show the dialog **/
	$(div).jqmShow();
}

// Only can call this at certain interval
IRACING.selectOpenSessionTimer		= 100;
IRACING.selectOpenSessionTimeout	= null;
function selectOpenSession(context, subSessionId, seasonId, UseCacheBuster, carId) {
	clearTimeout(IRACING.selectOpenSessionTimeout);
	
	if (arguments.length != 3 && arguments.length != 4 && arguments.length != 5) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SOS-001</strong>.", {textAlign:"left"});
		return;
	}
	
	if (!String(context).length) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SOS-002</strong>.", {textAlign:"left"});
		return;
	}
	
	if (isNaN(subSessionId) || parseInt(subSessionId) <= 0) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SOS-003</strong>.", {textAlign:"left"});
		return;
	}
	
	if (isNaN(seasonId) || parseInt(seasonId) <= 0) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SOS-004</strong>.", {textAlign:"left"});
		return;
	}
	
	if (arguments.length == 5 && (isNaN(carId) || parseInt(carId) <= 0)) {
		iRacingAlerts("<strong>Something went wrong!</strong><br /><br />We couldn't set up your active car for you. Please wait a moment, refresh the page, and try again. If this continues to happen, please contact <a href=\"javascript:launch_help();\">iRacing Support</a> and reference error code <strong>SOS-005</strong>.", {textAlign:"left"});
		return;
	}
	
	IRACING.selectOpenSessionTimeout = setTimeout(function() {
		/**
		 * 	We need access to the season to see if this is multicar
		 */
		var season = getSeasonById(seasonId);		
		if (!season) {
			return;
		}

		// look up the rules, if there are any
		var seriesIDValid = (parseInt(season.seriesid) > 0)
		var selectedSeriesID = (seriesIDValid) ? season.seriesid : 0;
		var seriesRules = checkForSeriesAcceptance(selectedSeriesID);
		
		// If there's rules, we see if the preference is set, and if it's valid
		// If not, we show the accept modal
		if (!$.isEmptyObject(seriesRules)) {
			
			// This is the lookup key for the member preference
			var preferenceKey = String("accepted_terms_seriesid_" + selectedSeriesID);
			
			// Default
			var lastAccepted = -1;
			
			// See if it's in prefslisting, then convert it to a number
			if (MemPrefsListing[preferenceKey] !== undefined && isString(MemPrefsListing[preferenceKey]) && MemPrefsListing[preferenceKey].length) {
				lastAccepted = parseInt(MemPrefsListing[preferenceKey]);
			}
			
			// {bool} have they accepted?
			var hasAcceptedTerms = (lastAccepted > seriesRules.as_of);
			
			/**
			 * Look in MemPrefsListing for it being overwritten in the page (this would be set by the page or by the result of the lookup func)
			 * If it's there, compare the values
			 * 
			 * If it's valid, just continue
			 * If it's invalid, do things
			 * 
			 */
			
			// If the found value or default value isn't valid
			if (!hasAcceptedTerms) {
				
				// If it was -1 we don't have it
				if (lastAccepted === -1) {
					
					// Look up the preference, set it, then reinvoke the function
					getMemberPreferenceAjax(
						preferenceKey, // pref name
						"0", // default value
						function(response) {
							var errorsInResponse = false;
							if (!$.isEmptyObject(response) && isString(response[preferenceKey]) && response[preferenceKey].length) {
								
								var formattedPrefValue = String(response[preferenceKey]);
								
								// Set the preference
								MemPrefsListing[preferenceKey] = formattedPrefValue;
								
								// Reinvoke the function
								if (carId) {
									selectOpenSession(context, subSessionId, seasonId, UseCacheBuster, carId);
								} else {
									selectOpenSession(context, subSessionId, seasonId, UseCacheBuster);
								}
								
								
							} else {
								errorsInResponse = true;
							}
							
						},
						function(err) {
							iRacingAlerts("Errors Registering or Session (TRS-03-Q)");
							console.warn(err)
						}
					);
					
				}
				// Otherwise we just prompt
				else {
					var boundFunc = null;
					if (carId) {
						boundFunc = selectOpenSession.bind(this, context, subSessionId, seasonId, UseCacheBuster, carId);
					} else {
						boundFunc = selectOpenSession.bind(this, context, subSessionId, seasonId, UseCacheBuster);
					}
					
					showSeriesTermsAcceptModal(
						seriesRules,
						boundFunc
					);
				}
				
				// Prevent going further
				return false;
			}
		}
		
		if (UseCacheBuster == null) UseCacheBuster = true;
		
		/**
		 * If this is a single car session we can go straight to the registration
		 */
		if (season.cars.length == 1 || context == "racepanel") {
			var state=Get_Cookie("panelstate");
			state=state|1;
			if(!(state&2))state=state|8;
			Set_Cookie("panelstate",state);
			var redirectTo = contextpath+"/member/RegisterForOpenSession.do?&subsessionid="+subSessionId+"&regloc="+context + ( (UseCacheBuster == true) ? "&nocache="+new Date().getTime() : "" );
			if (context == "racepanel" && carId) {
				redirectTo += "&carId=" + carId;
			}
			window.location.href=redirectTo;
			return;
		}
		
		var pref = multiClassSettings['carpopup.excluded_series'];
		if (pref) {
			var a = pref.split(",");
			for (var s in a) {
				if (s == season.seriesid) {
					var state=Get_Cookie("panelstate");
					state=state|1;
					if(!(state&2))state=state|8;
					Set_Cookie("panelstate",state);
					window.location.href=contextpath+"/member/RegisterForOpenSession.do?&subsessionid="+subSessionId+"&regloc="+context+ ( (UseCacheBuster == true) ? "&nocache="+new Date().getTime() : "" );
					return;
				}
			}
		}
	
		/** 
			Create and initialize a div to hold our dialog
		 */
		var div = el("selectCarDlg");
		if (!div) {
			var bgURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-background.gif)";
			div = document.body.appendChild(element("div", {id:"selectCarDlg", className:"jqmWindow"}, {backgroundImage:bgURL, textAlign:"left"}));
			$('#selectCarDlg').jqm({modal:true});
		}
	
		/**
			Populate our dialog with content (first remove any children in case we are coming back in here multiple times)
		 */			
		removeAllChildren(div);
		var container = div.appendChild(element("div", {}, {margin:"0px", padding:"0px", marginLeft:"20px", marginTop:"10px"}));
		var titleURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-select-a-car.gif)";
		var title = container.appendChild(element("div", {}, {width:"560px", height:"30px", backgroundImage:titleURL, textAlign:"right"}));
			var closeButton = title.appendChild(element("img", {src:imageserver+"/member_images/multiclass/modal/modal-cancel.jpg"}, {marginTop:"8px", marginRight:"8px"}));
			closeButton.onclick = function() {
				$("#selectCarDlg").jqmHide();
			}
			closeButton.onmouseover = function() {
				this.style.cursor = "pointer";
			}
			closeButton.onmouseout = function() {
				this.style.cursor = "default";
			}
		
		var div2 = container.appendChild(element("div", {}, {width:"560px", padding:"10px", border:"1px solid #aaaaaa", backgroundColor:"#eeeeee", margin:"0px"}));
			div2.appendChild(element("div", {innerHTML:"This is a multi-car session.  Select the car you would like to drive and press the 'Go' button."}, {fontSize:"8pt", textAlign:"center"}));
		
			var carSelect = div2.appendChild(element("select", {}, {width:"300px", fontSize:"8pt", cssFloat:"left", styleFloat:"left", marginTop:"15px", marginLeft:"74px"}));
			var y = 0;
			while (y < season.carclasses.length) {
				var carclass = season.carclasses[y++];
				var z = 0;
				while (carclass && carclass.carsinclass && z < carclass.carsinclass.length) {
					var car = carclass.carsinclass[z++];
					if (ownsCar(car.id)) {
						var label = decodeURIComponent(carclass.shortname) + " : " + decodeURIComponent(car.name); 
						carSelect.appendChild(element("option", {innerHTML:label, value:car.id}, {fontSize:"8pt"}));
					}
				}
			}
			selectOption(carSelect, racingpaneldata.car.id);				
		
			var goURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-go.gif)";
			var goButton = div2.appendChild(element("div", {}, {width:"67px", height:"23px", backgroundImage:goURL, cssFloat:"left", styleFloat:"left", marginTop:"13px", marginLeft:"25px", marginBottom:"10px"}));
			goButton.carSelect = carSelect;
			goButton.seasonId = seasonId;
			goButton.processing = false;
			goButton.onclick = function() {
				if (this.processing) {
					return;
				}
				this.processing = true;
				this.style.cursor = "wait";
				var parms={}
				parms['carId'] = this.carSelect.value;
				parms['seasonId'] = this.seasonId;
				if(this.carSelect.value){
					var gotoURL = contextpath+"/member/RegisterForOpenSession.do?&subsessionid="+subSessionId+"&carId="+this.carSelect.value+"&regloc="+context+ ( (UseCacheBuster == true) ? "&nocache="+new Date().getTime() : "" );
					var buf = load(contextpath+"/member/SelectCar",parms, selectCarHandler, gotoURL);				
				}else{
					iRacingAlerts("<strong>Something went wrong!</strong><br /><br />Please refresh the page and try again.", {textAlign:"left"});
				}				
			}
			goButton.onmouseover = function() {
				this.style.cursor = "pointer";
			}
			goButton.onmouseout = function() {
				this.style.cursor = "default";
			}
			
			var hideDiv = div2.appendChild(element("div", {}, {clear:"both", position:"relative", marginLeft:"10px"}));
				addCSDLink(hideDiv, season.seriesid);
	
			/** show the dialog **/
			$(div).jqmShow();
	}, Number(IRACING.selectOpenSessionTimer));
}

function registerAsSpectator(subsessionid, season, role, context) {
	//console.info(arguments)

	
	var suffix = "";
	if (role) {
		suffix = "&rl=" + role;
	}
	if (context) {
		suffix = suffix + "&context=" + context;
	}

	var state=Get_Cookie("panelstate");
	state=state|1;
	if(!(state&2))state=state|8;
	Set_Cookie("panelstate",state);

	/**
	 * If this is a single car session we can go straight to the registration
	 */
	if (season.cars.length == 1 || context == "racepanel") {
		document.location.href = contextpath+"/member/RegisterAsSpectator.do?subsessionid=" + subsessionid + suffix;
		return;
	}
	
	/**
	 * Multicar
	 */
	var pref = multiClassSettings['carpopup.excluded_series'];
	if (pref) {
		var ids = pref.split(",");
		var ndx = 0;
		while (ids && ndx < ids.length) {
			if (ids[ndx] == season.seriesid) {
				document.location.href = contextpath+"/member/RegisterAsSpectator.do?subsessionid=" + subsessionid + suffix;
				return;				
			}
			ndx++;
		}
	}
		
	/** 
		Create and initialize a div to hold our dialog
	 */
	var div = el("selectCarDlg");
	if (!div) {
		var bgURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-background.gif)";
		div = document.body.appendChild(element("div", {id:"selectCarDlg", className:"jqmWindow"}, {backgroundImage:bgURL, textAlign:"left"}));
		$('#selectCarDlg').jqm({modal:true});
	}

	/**
		Populate our dialog with content (first remove any children in case we are coming back in here multiple times)
	 */			
	removeAllChildren(div);
	var container = div.appendChild(element("div", {}, {margin:"0px", padding:"0px", marginLeft:"20px", marginTop:"10px"}));

	var titleURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-select-a-car.gif)";
	var title = container.appendChild(element("div", {}, {width:"560px", height:"30px", backgroundImage:titleURL, textAlign:"right"}));
		var closeButton = title.appendChild(element("img", {src:imageserver+"/member_images/multiclass/modal/modal-cancel.jpg"}, {marginTop:"8px", marginRight:"8px"}));
		closeButton.onclick = function() {
			$("#selectCarDlg").jqmHide();
		}
		closeButton.onmouseover = function() {
			this.style.cursor = "pointer";
		}
		closeButton.onmouseout = function() {
			this.style.cursor = "default";
		}
	
	var div2 = container.appendChild(element("div", {}, {width:"538px", height:"87px", padding:"10px", border:"1px solid #aaaaaa", backgroundColor:"#eeeeee", margin:"0px"}));
		div2.appendChild(element("div", {innerHTML:"This is a multi-car session.  We ask you to select a car in case you decide to drive a ghost car in sim.  Please select a car and press the 'Go' button."}, {fontSize:"8pt", textAlign:"center"}));
			var carSelect = div2.appendChild(element("select", {id:"carSelect"}, {width:"300px", fontSize:"8pt", cssFloat:"left", styleFloat:"left", marginTop:"15px", marginLeft:"74px"}));
			var y = 0;		
			while (y < season.carclasses.length) {
				var carclass = season.carclasses[y++];
				var z = 0;
				while (carclass && carclass.carsinclass && z < carclass.carsinclass.length) {
					var car = carclass.carsinclass[z++];
					if (ownsCar(car.id)) {
						var label = decodeURIComponent(carclass.shortname) + " : " + decodeURIComponent(car.name); 
						carSelect.appendChild(element("option", {innerHTML:label, value:car.id}, {fontSize:"8pt"}));
					}
				}
			}
			selectOption(carSelect, racingpaneldata.car.id);				
		
		var goURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-go.gif)";
		var goButton = div2.appendChild(element("div", {id:"goButton"}, {width:"67px", height:"23px", backgroundImage:goURL, cssFloat:"left", styleFloat:"left", marginTop:"13px", marginLeft:"25px", marginBottom:"10px"}));
		goButton.carSelect = carSelect;
		goButton.seasonId = season.seasonid;
		goButton.processing = false;
		goButton.onclick = function() {
			if (this.processing) {
				return;
			}
			this.processing = true;
			el("modalCarSelErr").innerHTML = "";
			el("modalCarSelErr").style.display = "none";
			this.style.cursor = "wait";
			var parms={}
			parms['carId'] = this.carSelect.value;
			parms['seasonId'] = this.seasonId;
			if(this.carSelect.value){
				var gotoURL = contextpath+"/member/RegisterAsSpectator.do?subsessionid=" + subsessionid + "&carId=" + this.carSelect.value + suffix;
				//var gotoURL = contextpath+"/member/RegisterForSession.do?&sessionid="+sessionId+"&regloc="+context+"&nocache="+new Date().getTime();
				var buf = load(contextpath+"/member/SelectCar",parms, selectCarHandler, gotoURL);				
			}else{
				iRacingAlerts("<strong>Something went wrong!</strong><br /><br />Please refresh the page and try again.", {textAlign:"left"});
			}				

		}
		goButton.onmouseover = function() {
			this.style.cursor = "pointer";
		}
		goButton.onmouseout = function() {
			this.style.cursor = "default";
		}
		
		div2.appendChild(element("div", {id:"modalCarSelErr"}, {clear:"both", fontSize:"7pt", width:"535px", color:"red", display:"none", textAlign:"center"}));
		
		var hideDiv = div2.appendChild(element("div", {}, {clear:"both", position:"relative", marginLeft:"10px"}));		
			addCSDLink(hideDiv, season.seriesid);
			
			
	/** show the dialog **/
	$(div).jqmShow();
	
}

function registerAsSpectatorForHosted(subsessionid, privateSessionId, carIds, role, context, password) {
	var suffix = "";
	if (role) {
		suffix = "&rl=" + role;
	}
	if (context) {
		suffix = suffix + "&context=" + context;
	}
	if (password) {
		suffix = suffix + "&password=" + password;
	}

	var state=Get_Cookie("panelstate");
	state=state|1;
	if(!(state&2))state=state|8;
	Set_Cookie("panelstate",state);

	if (carIds.length == 1) {
		document.location.href = contextpath+"/member/RegisterAsSpectatorForHosted.do?subsessionid=" + subsessionid + suffix;
		return;
	}
		
	/**
	  This is a multi-car session so we're going to display a modal dialog to get their car selection.  This is a multi-step 
	  process:
	  	1) Create a top level empty div if it doesn't already exist.  This will hold the dialog.
		2) Make the jqModal ui call to turn the div into a modal dialog (first time only)
		3) Populate the modal dialog with content
		4) Display the dialog
	*/	
	var div = el("selectCarDlg");
	if (!div) {
		var bgURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-background.gif)";
		div = document.body.appendChild(element("div", {id:"selectCarDlg", className:"jqmWindow"}, {backgroundImage:bgURL, textAlign:"left"}));
		$('#selectCarDlg').jqm({modal:true});
	}
	
	removeAllChildren(div);
	var container = div.appendChild(element("div", {}, {margin:"0px", padding:"0px", marginLeft:"20px", marginTop:"10px"}));
		var titleURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-select-a-car.gif)";
		var title = container.appendChild(element("div", {}, {width:"560px", height:"30px", backgroundImage:titleURL, textAlign:"right"}));
			var closeButton = title.appendChild(element("img", {src:imageserver+"/member_images/multiclass/modal/modal-cancel.jpg"}, {marginTop:"8px", marginRight:"8px"}));
			closeButton.onclick = function() {
				$("#selectCarDlg").jqmHide();
			}
			closeButton.onmouseover = function() {
				this.style.cursor = "pointer";
			}
			closeButton.onmouseout = function() {
				this.style.cursor = "default";
			}
		var div2 = container.appendChild(element("div", {}, {width:"538px", height:"87px", padding:"10px", border:"1px solid #aaaaaa", backgroundColor:"#eeeeee", margin:"0px"}));
			div2.appendChild(element("div", {innerHTML:"This is a multi-car session.  We ask you to select a car in case you decide to drive a ghost car in sim.  Please select a car and press the 'Go' button."}, {fontSize:"8pt", textAlign:"center"}));
			var carSelect = div2.appendChild(element("select", {id:"carSelect"}, {width:"240px", fontSize:"8pt", cssFloat:"left", styleFloat:"left", marginTop:"15px", marginLeft:"126px"}));
			var y = 0;
			while (y < carIds.length) {
				var car = getCarById(carIds[y++]);
				if (ownsCar(car.id)) {
					carSelect.appendChild(element("option", {innerHTML:decodeURIComponent(car.name), value:car.id}, {fontSize:"8pt"}));
				}
			}
			
			selectOption(carSelect, racingpaneldata.car.id);				
			var goURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-go.gif)";
			var goButton = div2.appendChild(element("div", {id:"goButton"}, {width:"67px", height:"23px", backgroundImage:goURL, cssFloat:"left", styleFloat:"left", marginTop:"13px", marginLeft:"5px"}));
			goButton.carSelect = carSelect;
			goButton.processing = false;
			goButton.onclick = function() {
				if (this.processing) {
					return;
				}
				this.processing = true;
				el("modalCarSelErr").innerHTML = "";
				el("modalCarSelErr").style.display = "none";
				this.style.cursor = "wait";
				var parms={}
				var carId = this.carSelect.value;
				parms['carId'] = carId;
				parms['privateSessionId'] = privateSessionId;
				var pw = "";
				if (password) {
					pw = password;
				}
				if(this.carSelect.value){
					var gotoURL = contextpath+"/member/RegisterAsSpectatorForHosted.do?subsessionid=" + subsessionid + "&carId=" + carId + suffix;
					//var gotoURL = contextpath+"/member/RegisterForHostedSession.do?&subsessionid="+sessionId+"&regloc="+context+"&privatesessionid="+privateSessionId+"&trackId="+trackId+"&carId="+carId+"&password="+pw+"&nocache="+new Date().getTime();
					var buf = load(contextpath+"/member/SelectHostedCar",parms, selectHostedCarHandler, gotoURL);				
				}else{
					iRacingAlerts("<strong>Something went wrong!</strong><br /><br />Please refresh the page and try again.", {textAlign:"left"});
				}					
			}
			
			div2.appendChild(element("div", {id:"modalCarSelErr"}, {fontSize:"7pt", clear:"both", width:"535px", color:"red", display:"none", textAlign:"center"}));
	$(div).jqmShow();
	
}

function registerAsSpotter(sid, ssid, driverId, password, context, pvtid) {
	logToConsole("> registerAsSpotter");
	logToConsole("sid = " + sid);
	logToConsole("ssid = " + ssid);
	logToConsole("driverId = " + driverId);
	logToConsole("password = " + password);
	logToConsole("context = " + context);
	logToConsole("pvtid = " + pvtid);
	
	/**
	 * I don't know if we need this panel stuff
	 */
	var state=Get_Cookie("panelstate");
	state=state|1;
	if(!(state&2))state=state|8;
	Set_Cookie("panelstate",state);

	/**
	 * For spotter sessions we don't need to worry about car selection with multicar sessions.  On the back end we'll grab
	 * the same car our driver selected
	 */
	var url = contextpath+"/member/RegisterAsSpotter.do?sid=" + sid + "&ssid=" + ssid + "&did=" + driverId + "&pw=" + password + "&cxt=" + context + "&pvtid=" + pvtid;
	document.location.href = url;
}

/**
 * Returns the current size of the browser window
 */
function getWindowSize() {
  var myWidth = 0, myHeight = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    myWidth = window.innerWidth;
    myHeight = window.innerHeight;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    myWidth = document.documentElement.clientWidth;
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
	//IE 4 compatible
    myWidth = document.body.clientWidth;
    myHeight = document.body.clientHeight;
  }
  return [myWidth, myHeight];
}



function selectHostedSession(context, sessionId, privateSessionId, trackId, carIds, password) {
	/**
	 * If this is a single car session we can go straight to the registration
	 */
	if (carIds.length == 1) {
		var state=Get_Cookie("panelstate");
		state=state|1;
		if(!(state&2))state=state|8;
		Set_Cookie("panelstate",state);
		var pw = "";
		if (password) {
			pw = encodeURIComponent(password);
		}
		
		var redirectURL = contextpath+"/member/RegisterForHostedSession.do?&subsessionid="+sessionId+"&regloc="+context+"&privatesessionid="+privateSessionId+"&trackId="+trackId+"&carId="+carIds[0]+"&password="+pw+"&nocache="+new Date().getTime();
		
		window.location.href = redirectURL;
		return;
	}

	/**
	  This is a multi-car session so we're going to display a modal dialog to get their car selection.  This is a multi-step 
	  process:
	  	1) Create a top level empty div if it doesn't already exist.  This will hold the dialog.
		2) Make the jqModal ui call to turn the div into a modal dialog (first time only)
		3) Populate the modal dialog with content
		4) Display the dialog
	*/	
	var div = el("selectCarDlg");
	if (!div) {
		var bgURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-background.gif)";
		div = document.body.appendChild(element("div", {id:"selectCarDlg", className:"jqmWindow"}, {backgroundImage:bgURL, textAlign:"left"}));
		$('#selectCarDlg').jqm({modal:true});
	}
	
	removeAllChildren(div);
	var container = div.appendChild(element("div", {}, {margin:"0px", padding:"0px", marginLeft:"20px", marginTop:"10px"}));
		var titleURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-select-a-car.gif)";
		var title = container.appendChild(element("div", {}, {width:"560px", height:"30px", backgroundImage:titleURL, textAlign:"right"}));
			var closeButton = title.appendChild(element("img", {src:imageserver+"/member_images/multiclass/modal/modal-cancel.jpg"}, {marginTop:"8px", marginRight:"8px"}));
			closeButton.onclick = function() {
				$("#selectCarDlg").jqmHide();
			}
			closeButton.onmouseover = function() {
				this.style.cursor = "pointer";
			}
			closeButton.onmouseout = function() {
				this.style.cursor = "default";
			}
		var div2 = container.appendChild(element("div", {}, {width:"538px", height:"87px", padding:"10px", border:"1px solid #aaaaaa", backgroundColor:"#eeeeee", margin:"0px"}));
			div2.appendChild(element("div", {innerHTML:"This is a multi-car session.  Select the car you would like to drive and press the 'Go' button."}, {fontSize:"8pt", textAlign:"center"}));
			var carSelect = div2.appendChild(element("select", {id:"carSelect"}, {width:"240px", fontSize:"8pt", cssFloat:"left", styleFloat:"left", marginTop:"15px", marginLeft:"126px"}));
			var y = 0;
			while (y < carIds.length) {
				var car = getCarById(carIds[y++]);
				if (ownsCar(car.id)) {
					carSelect.appendChild(element("option", {innerHTML:decodeURIComponent(car.name), value:car.id}, {fontSize:"8pt"}));
				}
			}
			
			selectOption(carSelect, racingpaneldata.car.id);				
			var goURL = "url(" + imageserver + "/member_images/multiclass/modal/modal-go.gif)";
			var goButton = div2.appendChild(element("div", {id:"goButton"}, {width:"67px", height:"23px", backgroundImage:goURL, cssFloat:"left", styleFloat:"left", marginTop:"13px", marginLeft:"5px"}));
			goButton.carSelect = carSelect;
			goButton.processing = false;
			goButton.onclick = function() {
				if (this.processing) {
					return;
				}
				this.processing = true;
				el("modalCarSelErr").innerHTML = "";
				el("modalCarSelErr").style.display = "none";
				this.style.cursor = "wait";
				var parms={}
				var carId = this.carSelect.value;
				parms['carId'] = carId;
				parms['privateSessionId'] = privateSessionId;
				var pw = "";
				if (password) {
					pw = encodeURIComponent(password);
				}
				var gotoURL = contextpath+"/member/RegisterForHostedSession.do?&subsessionid="+sessionId+"&regloc="+context+"&privatesessionid="+privateSessionId+"&trackId="+trackId+"&carId="+carId+"&password="+pw+"&nocache="+new Date().getTime();
				var buf = load(contextpath+"/member/SelectHostedCar",parms, selectHostedCarHandler, gotoURL);
			}
			
			div2.appendChild(element("div", {id:"modalCarSelErr"}, {fontSize:"7pt", clear:"both", width:"535px", color:"red", display:"none", textAlign:"center"}));
	$(div).jqmShow();
}	

function selectHostedCarHandler(req, forwardTo){
	return function(){
		if(req.readyState == 4) {
			if(req.status == 200){
				var res = extractJSON(req.responseText);
				if (res.rc != 0) {
					el("goButton").style.cursor = "default";				
					el("modalCarSelErr").innerHTML = "<br>Error selecting car.  If the problem persists contact customer support and provide error code " + res.rc;
					el("modalCarSelErr").style.display = "block";
					return;
				} 										
				var state=Get_Cookie("panelstate");
				state=state|1;
				if(!(state&2))state=state|8;
				Set_Cookie("panelstate",state);
				window.location.href=forwardTo;
			}
		}
	}
}

var getElementsByClassName = function (className, tag, elm){
	if (document.getElementsByClassName) {
		getElementsByClassName = function (className, tag, elm) {
			elm = elm || document;
			var elements = elm.getElementsByClassName(className),
				nodeName = (tag)? new RegExp("\\b" + tag + "\\b", "i") : null,
				returnElements = [],
				current;
			for(var i=0, il=elements.length; i<il; i+=1){
				current = elements[i];
				if(!nodeName || nodeName.test(current.nodeName)) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	else if (document.evaluate) {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = "",
				xhtmlNamespace = "http://www.w3.org/1999/xhtml",
				namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace)? xhtmlNamespace : null,
				returnElements = [],
				elements,
				node;
			for(var j=0, jl=classes.length; j<jl; j+=1){
				classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]";
			}
			try	{
				elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
			}
			catch (e) {
				elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
			}
			while ((node = elements.iterateNext())) {
				returnElements.push(node);
			}
			return returnElements;
		};
	}
	else {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = [],
				elements = (tag === "*" && elm.all)? elm.all : elm.getElementsByTagName(tag),
				current,
				returnElements = [],
				match;
			for(var k=0, kl=classes.length; k<kl; k+=1){
				classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
			}
			for(var l=0, ll=elements.length; l<ll; l+=1){
				current = elements[l];
				match = false;
				for(var m=0, ml=classesToCheck.length; m<ml; m+=1){
					match = classesToCheck[m].test(current.className);
					if (!match) {
						break;
					}
				}
				if (match) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	return getElementsByClassName(className, tag, elm);
};

function createCheckbox(id, props, label, labelClass, defValue, callback) {
	var cbProps = props;
	if (!cbProps) {
		cbProps = {};
	}
	cbProps['cursor'] = "pointer";
	var cb = element("div", {id:id}, cbProps);
	cb.callback = callback;
	cb.onmousedown = function() {
		return false;
	}
	cb.onmouseup = function() {
		var check=getElementsByClassName("checkboxChecked", "img", this)[0];
		if (check.style.visibility == "hidden") {
			check.style.visibility = "visible";
		}
		else {
			check.style.visibility="hidden";
		}	
		if (this.callback) {
			callback(check.style.visibility == "visible", id);
		}
	}
	var div = cb.appendChild(element("div", {}, {position:"relative"}));
	div.appendChild(element("img", {src:imageserver+"/member_images/multiclass/filter/checkboxUnchecked.gif"}, {width:"12px",height:"12px",position:"absolute",top:"2px",left:"2px"}));
	var check = div.appendChild(element("img", {className:"checkboxChecked",src:imageserver+"/member_images/results/xicon.gif"},
			{width:"12px",height:"12px",position:"absolute",top:"2px",left:"2px", visibility:"hidden"}));
	if (defValue && defValue == true) {
		check.style.visibility = "visible";
	}
	div.appendChild(element("div", {innerHTML:label, className:labelClass}));
	return cb;
}

function dumpProperties(obj, label) {
	logToConsole("> dumpProperties " + label);
	for (var prop in obj) {
		logToConsole(prop + " = " + obj[prop]);
	}
	logToConsole("< dumpProperties " + label);
}

function createFriendLinks(div, driverCustId, fsClass) {
	removeAllChildren(div);
	
	var friend = (FriendsListing[driverCustId]?FriendsListing[driverCustId]:0);
	var isWatched = (WatchedListing[driverCustId]?true:false);

	var friendLinkText = "Send Friend Request";
	if (friend==1) {
		friendLinkText = "Remove Friend";
	}else if(friend==2){
		friendLinkText = "Revoke Friend Request";
	}else if(friend==3){
		friendLinkText = "Accept Friend Request";
	}
		
	var watchedLinkText = "Add Studied";
	if (isWatched) {
		watchedLinkText = "Remove Studied";
	}

	var linkClass = (fsClass ? fsClass : "fsLink");
	var linkDiv = div.appendChild(element("div", {}, {textAlign:"center"}));
	linkDiv.style.width = div.style.width;
	linkDiv.style.height = div.style.height;
	var friendDiv = linkDiv.appendChild(element("span", {innerHTML:friendLinkText, className:linkClass}, {}));
	friendDiv.onclick = function() {
		var url;
		if (friend==0) {
			url = contextpath+"/member/SendFriendRequest";
		}else if(friend==1) {
			url = contextpath+"/member/RemoveFriend";
		}else if(friend==2) {
			url = contextpath+"/member/RevokeFriendRequest";
		}else if(friend==3) {
			url = contextpath+"/member/AcceptFriendRequest";
		}
		var result=load(url,{custid:driverCustId});
		if (result > -1 && result <4 ) {
			//we added / removed this guy from our friends list on the back end - update our local list and recreate the links 
			FriendsListing[driverCustId] = result;
		}
		createFriendLinks(div, driverCustId, fsClass);
	} 
	friendDiv.onmouseover = function() {
		this.style.cursor = "pointer";
	}
	friendDiv.onmouseout = function() {
		this.style.cursor = "default";
	}
	linkDiv.appendChild(element("span", {innerHTML:"|", className:linkClass}));
	var watchedDiv = linkDiv.appendChild(element("span", {innerHTML:watchedLinkText, className:linkClass}));
	watchedDiv.onclick = function() {
		var url;
		if (isWatched) {
			url = contextpath+"/member/RemoveWatched";
		}
		else {
			url = contextpath+"/member/AddWatched";
		}
		var result=load(url,{custid:driverCustId});
		if (result=="1") {
			// we added / removed this guy from our watched list on the back end - update our local list and recreate the links --%>
			if (isWatched) {
				WatchedListing[driverCustId] = 0;
			}
			else {
				WatchedListing[driverCustId] = 1;
			}
		}
		createFriendLinks(div, driverCustId, fsClass);
	} 	
	watchedDiv.onmouseover = function() {
		this.style.cursor = "pointer";
	}
	watchedDiv.onmouseout = function() {
		this.style.cursor = "default";
	}
}

/**
 * This converts html <'s and >'s into {'s and }'s so the content won't be rendered as html.  We using this with the member profile stuff to ensure
 * that people can't inject html into our site from their member bio.
 * 
 * @param strInputCode
 * @return
 */
function removeHTMLTags(strInputCode) {
	strInputCode = strInputCode.replace(/&(lt|gt);/g, function (strMatch, p1){
 		 	return (p1 == "lt")? "<" : ">";
 	}); 	
	var res = strInputCode.replace(/</g, "{").replace(/>/g, "}");
 	return res;
}

function truncateToNDecPts(value, numDecPts) {
	var pts = 2;
	if (numDecPts) {
		if (numDecPts < 0) {
			pts = 0;
		}
		if (numDecPts > 5) {
			pts = 5;
		}
	}	
	var buf = "" + value;
	var ndx = buf.indexOf(".");
	if (ndx < 0) {
		return buf;
	}
	return buf.substring(0, ndx + numDecPts + 1);
}

//<%-- Car popup --%>
CarPopup = {};
CarPopup.buildPopupCar = function(data,left,top){
		var popup=element("div",{},{zIndex:"3",position:"absolute",top:top+"px",left:left+"px",padding:"5px",backgroundColor:"white",border:"1px solid black",textAlign:"center"});
			popup.appendChild(element("div",{innerHTML:unescape(data.name),className:"bold"},{paddingTop:"10px"}));
			var imgdiv=popup.appendChild(element("div",{className:"car_size2"}));
			imgpreload(data.img,imgdiv,"car_size2");
		popup.onmouseout=function(e){removePopupOnBody(this.parentNode,e);};
		return popup;
}

CarPopup.mashPopupCar = function(layernode,img,name){
	var offsets=getOffsets(layernode);
	buildPopupOnBody({img:img,name:name},layernode,CarPopup.buildPopupCar,offsets.left+49,offsets.top-136)();
}
//<%-- End Car popup --%>

function isURL(value) {
	var url_pattern = new RegExp("((http|https)(:\/\/))?([a-zA-Z0-9\-]+[.]{1}){2}[a-zA-z0-9\-]+(\/{1}[a-zA-Z0-9\-]+)*\/?", "i");
	if(url_pattern.exec(value) == null || url_pattern.exec(value).index > 0) { 
  		return false;
	}
	
	/**
	 * At this point it looks like a url but we want to ignore any strings that look like they could be dates
	 */
	var date_pattern = new RegExp("[0-9]+[ /.-][0-9]+[ /.-][0-9]+", "i");
	if(date_pattern.exec(value) != null && date_pattern.exec(value).index >= 0) { 
  		return false;
	}
	
	
	return true;
}

function html_entity_decode(str) {
	var ta=document.createElement("textarea");
	ta.innerHTML=str.replace(/</g,"&lt;").replace(/>/g,"&gt;");
	return ta.value;
}

function serverLog(dest, msg) {
	try {
		var parms={}
		parms['logDest'] = dest;
		parms['logMsg'] = encodeURIComponent(msg);
		load(contextpath+"/member/LogSomething",parms,dummyAjaxHandler);
	}
	catch (err) {
		logToConsole("serverLog exception: " + err);
	}
}

function stopPropagation(e) {
	if (window.event) {
		e.cancelBubble=true; // IE
	} else {
		e.stopPropagation(); // Others
	}
}

function browserUses24HourClock() {
	var now = new Date();
	var localStr = now.toLocaleTimeString().toLowerCase();
	if (localStr.indexOf("am") >= 0 || localStr.indexOf("pm") >= 0) {
		return false;
	}
	return true;
}

function isSameDay(t1, t2) {
	var d1 = new Date(t1);
	var d2 = new Date(t2);
	
	if (d1.getFullYear() != d2.getFullYear()) {
		return false;
	}
	if (d1.getMonth() != d2.getMonth()) {
		return false;
	}
	if (d1.getDate() != d2.getDate()) {
		return false;
	}
	return true;
}

function daysDiff(t1, t2) {
	if (isSameDay(t1, t2)) {
		return 0;
	}
	
	return Math.abs(parseInt((t1.getTime() - t2.getTime()) / (1000 * 60 * 60 * 24)));	
}

function hoursDiff(t1, t2) {
	return Math.abs(parseInt((t1.getTime() - t2.getTime()) / (1000 * 60 * 60)));	
}

function minsDiff(t1, t2) {
	return Math.abs(parseInt((t1.getTime() - t2.getTime()) / (1000 * 60)));	
}

function secsDiff(t1, t2) {
	return Math.abs(parseInt((t1.getTime() - t2.getTime()) / (1000)));	
}

/**
 * Links are specified in the db based on image width of 1600 pixels - we need to adjust the x-coord based on the actual browser viewport width
 * 
 */
function addSBLink(id, left, top, width, height, loc, target) {
	var newLeft = left + ($(window).width() - 1600) / 2;
	var link = element("a", {id:id, className:"siteBGElement", href:loc, target:(target ? target : "_blank")}, {left:newLeft+"px",top:top+"px",width:width+"px",height:height+"px"});
	link.origLeft = left;
	document.body.appendChild(link);	
	return link;
}


function addSBCountdown(id, left, top, width, height, cssProps, endsAt) {
	var newLeft = left + ($(window).width() - 1600) / 2;
	
	if (el(id)) {
		/**
		 * Element already exists
		 */
		return;
	}
	var props = {};
	for (var prop in cssProps) {
		props.prop = cssProps[prop];
	}
	props.left = newLeft+"px";
	props.top = top+"px";
	props.width = width+"px";
	props.height = height+"px";
	props.border = "1px solid white";
	props.color = "white";

	var now = new Date();
	var diff = endsAt - now.getTime();
	if (diff < 0) {
		return;
	}
	var div = element("div", {id:id, className:"siteBGElement"}, props);
	document.body.appendChild(div);
	
	var dt = new Date(endsAt);
	
	var countdownHandler = {};
	countdownHandler.endsAt = endsAt;
	countdownHandler.div = div;
	countdownHandler.interval = setInterval(function() {
		var now = new Date();
		var diff = countdownHandler.endsAt - now.getTime();
		if (diff < 0) {
			clearInterval(countdownHandler.interval);
			$(div).remove();
		}
		else {
			
			var minuteMS = (1000 * 60);
			var hourMS = minuteMS * 60;
			var dayMS = hourMS * 24;
			
			var days = parseInt(diff / dayMS);
			var hours = parseInt((diff - (days * dayMS)) / hourMS);
			var minutes = parseInt((diff - (days * dayMS) - (hours * hourMS)) / minuteMS);
			var seconds = parseInt((diff - (days * dayMS) - (hours * hourMS) - (minutes * minuteMS)) / 1000);			
			$(div).text(days + "d:" + hours + "h:" + minutes + "m:" + seconds + "s");
		}		
	}, 1000)
		
}

/*========================== Get Class By Car ID ======================================*/
function getClassesByCarID(carID) {
	// Get all classes associated to a car's id
	var i = 0;
	var carClasses = {};
	for (var a in CarClassListing) {
			for (var b in CarClassListing[a].carsinclass) {
				if (CarClassListing[a].carsinclass[b].id == carID) {
					carClasses[i] = CarClassListing[a];
					i++;
				}
			}
	}
	return carClasses;
}

function getCarClassByCarAndSeriesID(carID,series) {
	// Give this function a series object and a car id and we'll figure out the right class from the series and return it.
	var x = {};
	
	if (series.carclasses.length == 1) {
		x[0] = series.carclasses[0].id;
	} else {
		for (i=0;i<series.carclasses.length;i++) {
			// series.carclasses[i]    // This is the actual data
			if (series.carclasses[i].carsinclass.length == 1) {
				x = series.carclasses[i].id;
				break;
			} else {
				for (s=0;s<series.carclasses[i].carsinclass.length;s++) {
					if (series.carclasses[i].carsinclass[s].id == carID) {
						x = series.carclasses[i].id;
						break;
					}
				}
			}
		}
	}
	return x;
}
/*================================ ####### ============================================*/




/**
Live Broadcasts
**/
function getBroadcasts(URLLocation) {
	var Now = new Date().getTime();
		Now = Number(Now);
		
	try {
		var url = URLLocation;
		
		$.getJSON(url,function(json){
			if (json.contents != null && json.contents.length > 0) {
				var broadcast = json.contents[0];
				if((Now > Number(broadcast.bannershowat)) && (Now < Number(broadcast.bannerhideat))){
					var Broadcast = document.getElementById("BroadcastBar");
					if (Broadcast != null) {
						Broadcast.parentNode.removeChild(Broadcast);
					}
					var Cookie		= (typeof($.cookie) == "function") ? $.cookie("showBroadcastBar") : "";
					var Caption		= broadcast.bannertext.replace(/[^a-zA-Z 0-9]+/g,' ');
					var Broadcast	= new BroadcastBar(Caption);
						Broadcast	= Broadcast.GetRenderedElement();
						if (Broadcast != null && Cookie != "hide") {
							document.body.appendChild(Broadcast);
							$("#BroadcastBar").delay(1000).animate({"bottom":"0"});
						}
				}
			}
		});
	} catch(e) {}
}

function BroadcastBar(caption) {
	this.Caption 			= String((caption != "undefined") ? caption : "");
	
	this.Container			= element("div", {"id":"BroadcastBar"});
	
	this.GetRenderedElement		= function() {
		
		var Container			= this.Container.appendChild(element("div",{"className":"inner"}));
			Container.appendChild(element("h1",{"innerHTML":caption.toUpperCase(),"title":caption.toUpperCase()}));
			
		var OnAir				= Container.appendChild(element("a",{"innerHTML":"","className":"OnAir","href":"http://www.iracing.com/live","target":"_blank"}));
		var Close				= Container.appendChild(element("a",{"innerHTML":"","className":"Close","href":"javascript:void(0);"}));
			Close.onclick = function() {
				$("#BroadcastBar").animate({"bottom":"-100px"}, function() { $(this).remove(); });
				$.cookie("showBroadcastBar", "hide", { path: "/", expires: 1 });
			}
		
		return this.Container;
	};
}

function liveBroadcastBar(broadcast) {
	var bodyColor = $('body').css("background-color");
	var testUrl = document.location.href.indexOf("Home.do");
	var refUrl = document.referrer;
	var liveBroadcasts = $.cookie("showBroadcastBar");
	
	/** Show the bar if the user hasn't clicked close (expires in 1 day) **/
	if(liveBroadcasts != 'hide') {
		$("#liveBroadcastTrack").html('<h1>' + broadcast + '</h1>');
		/** Only animate when the user first logs in **/
		if(testUrl != -1 && refUrl == ''){
			$('#liveBroadcastBar').delay(1000).slideDown(500);
		} else {
			$('#liveBroadcastBar').show();
		}
	}
	$('#closeBar').click(function(){
		$('#liveBroadcastBar').slideUp(500);
		$.cookie("showBroadcastBar", "hide", { path: "/", expires: 1 });
	});
}
function fadeBackground() {
	var bodyColor = $('body').css("background-color");
	var testUrl = document.location.href.indexOf("Home.do");
	var refUrl = document.referrer;
	
	/** Only animate when the user first logs in **/
	if(testUrl != -1 && refUrl == ''){
		$('#fader').css("background-color", bodyColor);
		$('#fader').delay(2000).fadeOut();
	}
}

/**
 * time is passed in as 10000ths of a second
 */
function formatLapTime(time){
	var full = time / 10000;
	var secsFull = parseInt(full);
	var leftOver = full - secsFull;
	leftOver = parseInt(leftOver * 1000);
	if (leftOver < 100) {
		leftOver = "0" + leftOver;
	}
	else if (leftOver < 10) {
		leftOver = "00" + leftOver;
	}
	var mins = parseInt(secsFull / 60);
	var secs = secsFull - (mins * 60);
	if (secs < 10) {
		secs = "0" + secs;
	}
	if (mins > 0) {
		return mins + ":" + secs + "." + leftOver;
	}
	return secs + "." + leftOver;	
}

function isBlackedOut(serviceName) {
	var blackedOut = false;
	if (initialBlackouts) {
		var ndx = initialBlackouts.objIndexOf(serviceName, "service");
		if (ndx >= 0) {
			var blackout = initialBlackouts[ndx];
			if (blackout.ineffect == 1) {
				blackedOut =  true;
			}
		}
	}
	return blackedOut;
}


function removeAccents(strAccents) {
	var strAccents = strAccents.split('');
	var strAccentsOut = new Array();
	var strAccentsLen = strAccents.length;
	var accents = '������������������������������������������������������񊚟����';
	var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
	for (var y = 0; y < strAccentsLen; y++) {
		if (accents.indexOf(strAccents[y]) != -1) {
			strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
		} else
			strAccentsOut[y] = strAccents[y];
	}
	strAccentsOut = strAccentsOut.join('');
	return strAccentsOut;
}

var iracingScriptLoaded = true;

function convertCurlyQuotesAndDashes(buf) {
	if (!buf) {
		return;
	}
	if (typeof buf != "string") {
		return buf;
	}
	/**
	 * convert common characters (curly quotes and em dashes) that are outside of the utf-8 character set.
	 */  
	return buf.replace(/\u2012|\u2013|\u2014|\u2015/g, '-')
							.replace(/\u2018|\u2019/g, "'")
							.replace(/\u201C|\u201D/g, '"')
							.replace(/\uFFFD/g, '?');
	
}

//	Detect Windows 8.1 and IE11
//  Now with Windows 10!
function theWindowsSpecial(force){
	
	if((!systemversions && !downloadstatus && window.navigator.appVersion.indexOf('Windows NT 6.3') != -1 && !systemversions && window.navigator.appVersion.indexOf('rv:11.0') != -1) || (force == 1)){
		$('body').css('padding-top','75px');
		if($('body').css('background-image').length > 0){
			$('body').css('background-position','center 75px');
		}
		
		$('body div:first').before('<div id="ie-message-container"><div id="ie-message"><h2>Add iRacing.com as a Trusted Site in IE 11</h2><a href="#">Click Here</a><span>To update your service, join races, or purchase content, you must change some privacy settings in Internet Explorer 11 with Windows 8.1. Click the button for instructions.</span></div></div>');
		
		$('#ie-message-container').css({
			width: "100%",
			height: "75px",
			position: "absolute",
			top:"0",
			background: "#00394c"
		});
				
		// I'm doing the styling dynamically because we can't rely on a single stylesheet across multiple sites
		var bg;
		if(imageserver.length == 0){
			bg = "url(images/ie-11/ie-stop.png) no-repeat 0 15px";
		} else {
			bg = "url("+imageserver+"/member_images/aboveheader/ie-stop.png) no-repeat 0 15px";
		}
		
		$('#ie-message').css({
			display: "block",
			float:"none",
			color:"#ffffff",
			textAlign:"left",
			width:"892px",
			height:"75px",
			margin:"0 auto",
			padding:"0 0 0 80px",
			background:bg
		});
		$('#ie-message h2').css({
			margin: "8px 0 5px 0",
			fontSize: "18px",
			lineHeight:"18px",
			padding:"0",
			fontWeight: "bold",
			width: "640px",
			display:"block",
			float: "left"
		});
		$('#ie-message span').css({
			fontSize: "12px",
			lineHeight: "16px",
			padding:"0",
			width: "600px",
			margin: "0",
			display:"block",
			color: "#ffffff"
		});
		$('#ie-message a').css({
			color:"#000000",
			fontSize: "18px",
			textAlign: "center",
			fontWeight: "bold",
			lineHeight: "43px",
			marginTop: "15px",
			width: "160px",
			height: "45px",
			display:"block",
			float: "right",
			background: "#ffffff"
		});
		$('#ie-message a').click(function(){
			window.open(contextpath+"/ie-11.jsp", "_blank", 'toolbar=no,width=680,height=400,left=0,top=0,scrollbars=yes,status=no');
		});
	}
	// Windows 10 error
	else if ((!systemversions && !downloadstatus && (window.navigator.appVersion.indexOf('Windows NT 10') != -1)) || (force == 2)){
//		$('body').css('padding-top','75px');
//		if($('body').css('background-image').length > 0){
//			$('body').css('background-position','center 75px');
//		}
//		
//		$('body div:first').before('<div id="ie-message-container"><div id="ie-message"><h2>Getting iRacing to run with Windows 10 + Edge</h2><a href="#">Click Here</a><span>Windows 10 and Edge should work with iRacing natively. In the event you experience issues, click the button for instructions on how to resolve the issue.</span></div></div>');
//		
//		$('#ie-message-container').css({
//			width: "100%",
//			height: "75px",
//			position: "absolute",
//			top:"0",
//			background: "#00394c"
//		});
//				
//		// I'm doing the styling dynamically because we can't rely on a single stylesheet across multiple sites
//		var bg;
//		if(imageserver.length == 0){
//			bg = "url(images/ie-11/ie-stop.png) no-repeat 0 15px";
//		} else {
//			bg = "url("+imageserver+"/member_images/aboveheader/ie-stop.png) no-repeat 0 15px";
//		}
//
//		$('#ie-message').css({
//			display: "block",
//			float:"none",
//			color:"#ffffff",
//			textAlign:"left",
//			width:"892px",
//			height:"75px",
//			margin:"0 auto",
//			padding:"0 0 0 80px",
//			background:bg
//		});
//		$('#ie-message h2').css({
//			margin: "8px 0 5px 0",
//			fontSize: "18px",
//			lineHeight:"18px",
//			padding:"0",
//			fontWeight: "bold",
//			width: "640px",
//			display:"block",
//			float: "left"
//		});
//		$('#ie-message span').css({
//			fontSize: "12px",
//			lineHeight: "16px",
//			padding:"0",
//			width: "600px",
//			margin: "0",
//			display:"block",
//			color: "#ffffff"
//		});
//		$('#ie-message a').css({
//			color:"#000000",
//			fontSize: "18px",
//			textAlign: "center",
//			fontWeight: "bold",
//			lineHeight: "43px",
//			marginTop: "15px",
//			width: "160px",
//			height: "45px",
//			display:"block",
//			float: "right",
//			background: "#ffffff"
//		});
//		$('#ie-message a').click(function(){
//			window.open(contextpath+"/win10.jsp", "_blank", 'toolbar=no,width=680,height=400,left=0,top=0,scrollbars=yes,status=no');
//		});
	}

}

function lightsOn() {
	$(".lightsOutDiv").fadeOut("medium")
	$(".driverModal").fadeOut("fast");
	$("#verify-withdraw,#iracing-alert-msg,#iracing-terms").fadeOut("fast", function() {
		$(this).remove();
	});
	removeUILoaders();
}

function lightsOut() {
	// Add a div to dim the lights
	var zIndex = 20;
	$("<div>", {
		"style"	: "background:rgba(0,0,0,0.75);left:0;top:0;z-index:"+zIndex+";position:absolute;display:none;width:100%; height: " + document.body.offsetHeight + "px;cursor:pointer;",
		"class"	: "lightsOutDiv"
	}).click(function() {
		lightsOn();
	}).stop(false,true).fadeIn().appendTo("body");
};

// Set up console mappings so we can clear console
try {
	if (typeof console._commandLineAPI !== 'undefined') {
	    console.API = console._commandLineAPI;
	} else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
	    console.API = console._inspectorCommandLineAPI;
	} else if (typeof console.clear !== 'undefined') {
	    console.API = console;
	}
} catch(e) { console.warn(e); }

function clearConsole() {
	try {console.API.clear();} catch(e) {};
};

// Let's be able to push to an object without math!
function objectPush(objectName,toAdd) {
	// Get length
	var i=0;
	for (e in objectName) { i++; };
	objectName[i]=toAdd;
	return objectName;
};

// Get and object's size
function getObjectSize(object) {
	var i = 0;
	var obj = deepClone(object);
	function eachRecursive(obj) {
		for (var k in obj) {
			if (typeof obj[k] == "object" && obj[k] !== null) eachRecursive(obj[k]);
			else i++;
		};
	};
	eachRecursive(obj)
	return i;
};

function keysToLowerCase(obj){
	if (obj == null) return obj;
    Object.keys(obj).forEach(function(key){
        var k=key.toLowerCase().replace(" ","").replace(/_/gi,"");
        if(k!= key){
            obj[k]= obj[key];
            delete obj[key];
        }
    });
    return (obj);
};

// Recursive function to normalize an object
function normalizeObject(object) {
	var returnObject = deepClone(object);
		returnObject = keysToLowerCase(returnObject);
	
	return returnObject;
};

// Determine Join Code
function getJoinStatusCode(params) {
	// Use these internally
	var suppliedParams		= deepClone(params);
	
	// Join Code
	var joinStatus			= 0;
	
	// Checks
	if(!systemversions) {
		// Service isn't running
		joinStatus = 7;  // SERVICE_NOT_RUNNING
	} else if (suppliedParams.regSessionID == suppliedParams.sessionID) {
  		// Already registered for this session
  		joinStatus = 5;  // ALREADY REGISTERED
	} else if (suppliedParams.regSessionID != 0) {
		// Already registered elsewhere
		joinStatus = 6;  // REGISTERED ELSEWHERE
 	} else if (suppliedParams.restrictViewing && !checkEligByCLT(suppliedParams.allowedEntities, 1)) {
		// Not eligible b/c of club
		joinStatus = 14; // CLUB_INELIGIBLE
	} else if (suppliedParams.restrictViewing && !checkEligByCLT(suppliedParams.allowedEntities, 2)) {
		// Not eligible b/c of team
		joinStatus = 28; // NON_TEAM_MEMBER
	} else if (suppliedParams.restrictViewing && !checkEligByCLT(suppliedParams.allowedEntities, 3)) {
		// Not eligible b/c of league
		joinStatus = 27; // NON_LEAGUE_MEMBER
	} else if ((suppliedParams.eligible == 0 || suppliedParams.clubEligible == 0 || suppliedParams.regOpen == 0) && suppliedParams.purchase.length > 0) {
 		// License ineligible or club ineligible or registration is closed and they need to purchase content in order to watch
 		joinStatus = 17; // PURCHASE_REQUIRED
 	} else if (suppliedParams.purchase.length > 0) {
  		// Need to purchase to watch
  		joinStatus = 17; // PURCHASE_REQUIRED
  	} else if (suppliedParams.updateRequired == 1) {
  		// Need to update
		joinStatus = 1; // UPDATES_REQUIRED
	} else if (suppliedParams.eligible == 0 || suppliedParams.clubEligible == 0 || suppliedParams.regOpen == 0) {
		if (suppliedParams.watchable == 1) {
			// If we can spot
			//joinStatus = 24;
			// else Session available for watching only
			joinStatus = 16; // READY TO WATCH
		} else {
			// Session unavailable for watching (all slots taken)
			joinStatus = 18; // SESSION UNAVAILABLE
		};
	};
	
	// If we got this far and the status is still 0 the session appears to be joinable.  We're not allowing them to race from this page at this time. This is used by suppliedParams.canRace true/false
	if ((suppliedParams.canRace == false) && joinStatus == 0) {
		if (suppliedParams.watchable == 1) {
			joinStatus = 16;
		} else {
			joinStatus = 18;
		};
	};
	
	//
	//joinStatus = 25 or 24;
	
	
	return joinStatus;
};

// Read Parameters from the url
function getParams(nocache) {
	var params = {};
	if(location.search) {
		var parts = location.search.slice(1).split('&');
		parts.forEach(function (part) {
			var pair = part.split('=');
			pair[0] = decodeURIComponent(pair[0]);
			pair[1] = decodeURIComponent(pair[1]);
			if(pair[1] !== 'undefined'){
				params[pair[0]] = pair[1];
			}
		});
		if(nocache){
			params.nocache = new Date().getTime();
		}
	}
	return params;
};

function getRacepanelSeries(availableSeries,ovalroad,includeLite,isEligible) {
	var returnData = Array();
	
	if (availableSeries && availableSeries.length) {
		var numAdded = 0;
		var ndx = 0;
		for (var i=0;i<availableSeries.length;i++) {
			var eachSeries		= availableSeries[i];
			var eachSeason		= SeasonListing[SeasonListing.objIndexOf(eachSeries.seasonid,"seasonid")];
			
			if ((eachSeries.eligible == isEligible) && (eachSeries.category == ovalroad) && (eachSeason.islite == includeLite)) {
				returnData.push(eachSeries);
			};
		};
	};
	
	return returnData;
};


// Rescued from flash_tickers_frag:
function getSeasonInfo(seasonid,trackid,isPractice){
	var str="";
	var a={name:"",eligible:0,clubEligible:0,purchase:[],updateRequired:0,update:[],licgroupid:0,serieslicgroupid:0,minsr:"",regSessionID:0};
	var season_ind=SeasonListing.objIndexOf(seasonid,"seasonid");
	if(season_ind!=-1){
		var eachseason=SeasonListing[season_ind];
		if (eachseason.isClubAllowed == true) {
			a.clubEligible = 1;
		}
		a.name=eachseason.seriesshortname;
		a.licgroupid=eachseason.licgroupid;
		a.serieslicgroupid=eachseason.serieslicgroupid;
		a.minsr=eachseason.minsr;
		var cars=eachseason.cars;
		
		// Look at the car(s) for the session to see if we own any of the cars
		var ownsAnyCars = ownsAnyOfTheseCars(cars);
		
		for(var i=0,len=cars.length;i<len;i++){
			var each=cars[i];
			var carId = each.id;
			var owned_idx=OwnedContentListing.objIndexOf(each.pkgid,"pkgid");
			if (owned_idx == -1) {
				// they don't own a car in this session
				if (ownsAnyCars && canDownloadCarById(carId)) {
					if (carNeedsUpdateById(carId)) {
						a.update.push(each.pkgid);
					}
				}
				else {
					a.purchase.push(each.sku);
				}
			}
			else if (carNeedsUpdateById(carId)) {
				a.update.push(each.pkgid);
			}				
		}
		var track_ind=TrackListing.objIndexOf(trackid,"id");
		if(track_ind!=-1){
			var each=TrackListing[track_ind];
			var owned_idx=OwnedContentListing.objIndexOf(each.pkgid,"pkgid");
			if(owned_idx==-1)a.purchase.push(each.sku);
			else if(OwnedContentListing[owned_idx].update)a.update.push(each.pkgid);
		}
		a.regSessionID=racingpaneldata.session?racingpaneldata.session.sessionid:0;
		if(a.update.length || overallUpdateRequired)a.updateRequired=1;
		var license_idx=MemBean.licenses.objIndexOf(SeasonListing[season_ind].category,"catID");
		
		//If it is a practice session and the ignore license is set the user is eligible
		if(isPractice && eachseason.ignoreLicenseForPractice){
			a.eligible=1;
		}else{
			if(MemBean.licenses[license_idx].liclevel>=SeasonListing[season_ind].minlicenselevel && MemBean.licenses[license_idx].liclevel<=SeasonListing[season_ind].maxlicenselevel)a.eligible=1;
		}
		var str='{"name":"'+a.name+'","eligible":'+a.eligible+',"clubEligible":' + a.clubEligible + ',"purchase":['+a.purchase.join(",")+'],"updateRequired":'+a.updateRequired+',"update":['+a.update.join(",")+'],"licgroupid":'+a.licgroupid+',"serieslicgroupid":'+a.serieslicgroupid+',"minsr":"'+a.minsr+'","regSessionID":'+a.regSessionID+'}';
	}
	return str;
}

// Modified from getSeasonInfo() to get hosted session update info
function getHostedUpdatesInfo(carIDs,trackId){
	var a = {update:[],purchase:[]};
	
	// Figure out tracks
	var track_ind=TrackListing.objIndexOf(trackId,"id");
	if (track_ind == -1) return null;
	var each=TrackListing[track_ind];
	var catId = each.catid;
	var owned_idx=OwnedContentListing.objIndexOf(each.pkgid,"pkgid");
	if(owned_idx==-1)a.purchase.push(each.sku);
	else if(OwnedContentListing[owned_idx].update)a.update.push(each.pkgid);
	
	// Figure Out cars
	if (carIDs && carIDs.length) {
		var carIDs = carIDs.split(",");
		var ownAtLeastOneCar = false;
		
		$.each(carIDs, function(k, each) {
			var carId = each;
			var car_ind=CarListing.objIndexOf(carId,"id");
			if (car_ind == -1) return null;
			var each=CarListing[car_ind];
			var owned_idx=OwnedContentListing.objIndexOf(each.pkgid,"pkgid");
			if(owned_idx==-1){
				owned_idx = UnownedAllowedContentListing.objIndexOf(each.pkgid,"pkgid");
				if(owned_idx==-1){
					a.purchase.push(each.sku);
		 		}else{
		 			if(UnownedAllowedContentListing[owned_idx].update)a.update.push(each.pkgid);
				}
			}else{
			    ownAtLeastOneCar = true;
			   	if(OwnedContentListing[owned_idx].update)a.update.push(each.pkgid);
			}
		});		
	};
	
	// Updates
	if(a.update.length || overallUpdateRequired)a.updateRequired=1;
	
	return a;
}

// Is a car owned?
function isACarOwned(carID) {
	var carIDX			= CarListing.objIndexOf(carID,"id");
	var thisCar			= ((carIDX != -1)?CarListing[carIDX]:-1);
	var isCarOwned		= false;
	
	if (thisCar != -1) {
		var pkgIDX		= OwnedContentListing.objIndexOf(thisCar.pkgid,"pkgid");
		if (pkgIDX != -1) {
			var package		= OwnedContentListing[pkgIDX];
			if (package) {
				isCarOwned = true;
			};
		};
	};
	
	return isCarOwned;
}

//Is a track owned?
function isATrackOwned(trackID) {
	var trackIDX			= TrackListing.objIndexOf(trackID,"id");
	var thisTrack			= ((trackIDX != -1)?TrackListing[trackIDX]:-1);
	var isTrackOwned		= false;
	
	if (thisTrack != -1) {
		var pkgIDX		= OwnedContentListing.objIndexOf(thisTrack.pkgid,"pkgid");
		if (pkgIDX != -1) {
			var package		= OwnedContentListing[pkgIDX];
			if (package) {
				isTrackOwned = true;
			};
		};
	};
	
	return isTrackOwned;
}

// Internal logging
var allowedLogs = {"general":true,"leagues":true,"teams":false};
var NOLOGS = false;

function makeLog(data,type,category) {
	if (NOLOGS) return;
	if (!category) {
		category = "general";
	};
	if (!type) {
		type = "log";
	}
	if (eval("allowedLogs."+category)) {
		try {
			if (type == "info") {
				console.info(data);
			} else if (type == "log") {
				console.log(data);
			} else if (type == "warn") {
				console.warn(data);
			}
		} catch(e) {
			console.group("(!) ERROR MAKING LOG");
			console.log(e)
			console.groupEnd();
		};
	};
};

function GetSeasonEligibility(id) {
	var Return = {
			OP		: false,
			Races	: false
	}
	
	var Season = getSeasonByID(id);
	if (Season != null) {
		Return.Races		= Season.licenseEligible;
		Return.OP			= ((Season.licenseEligible == true) ? true : Season.ignoreLicenseForPractice);
	}
	
	return Return;
}

function getSeasonByID(id) {
	var sID = SeasonListing.objIndexOf(id,"seasonid");
	var returnObj = null;
	if (sID != -1) {
		returnObj = SeasonListing[sID];
	}
	return returnObj;
}


function iRacingConfirm(msg, preferences, okfunc, cancelfunc) {
	lightsOn();
	lightsOut();
	var outerDiv = $("<div>", {
		"id"			: "iracing-alert-msg",
		"style"			: "display: block; opacity: 0; z-index: 21; background: #f5f5f5; text-shadow: 0 1px 0 #fff; width: 300px; position: fixed; left: "+Number(($(window).width()/2) - 150)+"px; top: 50%; margin: -100px 0 0; padding: 0;"
	}).animate({"opacity":0});
	var innerDiv = $("<div>", {
		"style"			: "padding: 10px;"
	}).appendTo(outerDiv);
	
	var Preferences = {
		textAlign				: String((preferences != undefined && preferences.textAlign) ? preferences.textAlign : "center")
	}
	
	if (okfunc == undefined) {
		okfunc = function() {}
	}
	
	if (cancelfunc == undefined) {
		cancelfunc = function() {}
	}
	
	$("<p>", {"html":"iRacing.com says:","style":"font-size: 11px; line-height: 100%; margin: 0 auto 0; text-align: left; padding: 0 0 10px; font-weight: bold; border-bottom: 1px solid #ddd;"}).appendTo(innerDiv);
	
	$("<p>", {"html":msg.replace("\n","<br />"),"style":"font-size: 11px; line-height: 100%; margin: 10px auto; text-align: " + Preferences.textAlign + "; padding: 0;"}).appendTo(innerDiv);
	
	var ConfirmationDivs = $("<div>",{"class":"clearfix","style":"border-top: 1px solid #ddd;"}).appendTo(innerDiv);
	
	var OKBtn = $("<a>", {
		"html"			: "<i class=\"icon icon-check-circle\" style=\"position: relative;top: 2px;\"></i> OK",
		"class"			: "toolbar-button-right",
		"href"			: "javascript:void(0);",
		"style"			: "margin-bottom: 0;"
	}).click(function() {
		lightsOn();
		okfunc();
	}).appendTo(ConfirmationDivs);
	$("<a>", {
		"html"			: "<i class=\"icon icon-cancel-circle\" style=\"position: relative;top: 2px;\"></i> Cancel",
		"class"			: "toolbar-button-right",
		"href"			: "javascript:void(0);",
		"style"			: "margin-bottom: 0;"
	}).click(function() {
		lightsOn();
		cancelfunc();
	}).appendTo(ConfirmationDivs);
	
	// Show it
	$(outerDiv).appendTo("body").animate({"opacity":1});
}

function iRacingAlerts(msg, preferences) {
	lightsOn();
	lightsOut();
	var outerDiv = $("<div>", {
		"id"			: "iracing-alert-msg",
		"style"			: "display: block; opacity: 0; z-index: 21; background: #f5f5f5; text-shadow: 0 1px 0 #fff; width: 300px; position: fixed; left: "+Number(($(window).width()/2) - 150)+"px; top: 50%; margin: -100px 0 0; padding: 0;"
	}).animate({"opacity":0});
	var innerDiv = $("<div>", {
		"style"			: "padding: 10px;"
	}).appendTo(outerDiv);
	
	var Preferences = {
		textAlign				: String((preferences != undefined && preferences.textAlign) ? preferences.textAlign : "center")
	}
	
	$("<p>", {"html":"iRacing.com says:","style":"font-size: 11px; line-height: 100%; margin: 0 auto 0; text-align: left; padding: 0 0 10px; font-weight: bold; border-bottom: 1px solid #ddd;"}).appendTo(innerDiv);
	
	$("<p>", {"html":msg.replace("\n","<br />"),"style":"font-size: 11px; line-height: 100%; margin: 10px auto; text-align: " + Preferences.textAlign + "; padding: 0;"}).appendTo(innerDiv);
	
	var ConfirmationDivs = $("<div>",{"class":"clearfix","style":"border-top: 1px solid #ddd;"}).appendTo(innerDiv);
	
	var OKBtn = $("<a>", {
		"html"			: "<i class=\"icon icon-check-circle\" style=\"position: relative;top: 2px;\"></i> OK",
		"class"			: "toolbar-button-right",
		"href"			: "javascript:void(0);",
		"style"			: "margin-bottom: 0;"
	}).click(function() {
		lightsOn();
	}).appendTo(ConfirmationDivs);
	
	
	// Show it
	$(outerDiv).appendTo("body").animate({"opacity":1});
}

function GetQuarters(Year) {
	var ReturnObj = {};
	
	if (Year == null) Year = currentSeason.year;
	
	var year_idx			= YearAndQuarterListing.objIndexOf(Year,"year");
	
	if(year_idx!=-1) {
		ReturnObj			= YearAndQuarterListing[year_idx].quarters;
	}
	
	return ReturnObj;
}

function GetRaceWeeks(Year,QuarterNum) {
	var ReturnObj = -1;
	
	if (Year == null) Year = currentSeason.year;
	
	var Quarters = GetQuarters(Year);
	
	var quarter_idx=Quarters.objIndexOf(QuarterNum, "quarterid");
	if(quarter_idx!=-1){
		ReturnObj = Quarters[quarter_idx].numweeks;
	}
	
	
	return ReturnObj;
}

//Catchall async ajax
function GetAjaxAsync(location) {
	var returnSTR = $.ajax({
		"url":			location,
		"async":		false
	}).done(function(data) {
		return data;
	});
	
	if (returnSTR && returnSTR.readyState == 4 && returnSTR.status == 200 && trim(returnSTR.responseText.charAt(0)).indexOf(["<","\r","\n"]) == -1 ) {
		return decodeAllFields(JSON.parse(returnSTR.responseText));
	} else {
		return JSON.parse("{}");
	}
};

// Ajax, with Data
function GetAjaxWithDataAsync(location,data) {
	var returnSTR = $.ajax({
		"url":			location,
		"data":			data,
		"async":		false
	}).done(function(data) {
		return data;
	});
	
	if (returnSTR && returnSTR.readyState == 4 && returnSTR.status == 200 && trim(returnSTR.responseText.charAt(0)).indexOf(["<","\r","\n"]) == -1 ) {
		return decodeAllFields(JSON.parse(returnSTR.responseText));
	} else {
		return JSON.parse("{}");
	}
};

//Get new MemBean Stuff
function SendAjaxMemPreferenceAsync(PrefName,Value,UpdateName) {
	
	if (!PrefName || !Value) return null;
	
	var PostData = {};
		PostData[PrefName] = Value;
		
	var returnSTR = $.ajax({
		"url"			: contextpath+"/member/SetMemberPreferences",
		"method"		: "POST",
		"async"			: false,
		"data"			: PostData
	}).success(function(data) {
		return data;
	}).fail(function(data) {
		return "{}";
	});
	return decodeAllFields(extractJSON(returnSTR.responseText));
};

// Get new MemBean Stuff
function GetMemberBean() {
	var returnSTR = $.ajax({
		"url":			membeanAjaxURL,
		"async":		false
	}).success(function(data) {
		return data;
	}).fail(function(data) {
		return "{}";
	});
	return decodeAllFields(extractJSON(returnSTR.responseText));
};

// Find an objindexof without breaking
function getIndexOf(index,referenceobject,key) {
	returnOBJ = {};
	var referenceobject = deepClone(referenceobject);
	var idx=referenceobject.objIndexOf(index,key);
	if(idx!=-1){
		returnOBJ = deepClone(referenceobject[index]);
	}
	return returnOBJ;
}

// Methods to show various terms & agreemens
	function displayAgreements(args) {
		
		var Params = GetMemberBean();
		
		if (!$.isEmptyObject(Params) || Params == null || Params != undefined) {
			
			args["tc"]		= Boolean(Params["hasReadTC"]);
			args["pp"]		= Boolean(Params["hasReadPP"]);
			
			if (!Boolean(args["tc"]) || !Boolean(args["pp"])) {
				lightsOn();
				lightsOut();
				var outerDiv = $("<div>", {
					"id"			: "iracing-alert-msg",
					"style"			: "display: block; opacity: 0; z-index: 21; background: #f5f5f5; text-shadow: 0 1px 0 #fff; width: 600px; position: absolute; left: "+Number(($(window).width()/2) - 300)+"px; top: 100px; margin: 0; padding: 0;"
				}).animate({"opacity":0});
				var innerDiv = $("<div>", {
					"style"			: "padding: 10px;",
					"class"			: "clearfix"
				}).appendTo(outerDiv);
				
				// Remove click
				var lightsOutBG = document.getElementsByClassName("lightsOutDiv");
				if (lightsOutBG.length) {
					lightsOutBG = lightsOutBG[0];
					var cloned_lightsOutBG = lightsOutBG.cloneNode(true);
					lightsOutBG.parentNode.replaceChild(cloned_lightsOutBG, lightsOutBG);
					
					cloned_lightsOutBG.style.opacity = 1;
					
				}
				
				// Dynamic width
				var width = ((!Boolean(args['tc']) && !Boolean(args['pp']))?"45%":"360px");
				var css = "border: 1px dashed rgba(0,0,0,0.25); background: rgba(255,255,255,0.75); margin: 0 8px;";
				
				$("<h2>",{"html":"<strong>Our Policies Have Been Updated</strong>"}).appendTo(innerDiv);
				$("<p>",{"html":"Please click on each policy listed below to read them,<br />then click \"I Accept\" to accept them."}).appendTo(innerDiv);
				
				// Show Terms & Conditions
				if (!Boolean(args["tc"])) {
					var tcBox = $("<div>",{"class":"clearfix floatleft","style":"width: "+width+";"+css}).appendTo(innerDiv);
					var tcBox = $("<div>",{"style":"padding: 5px;"}).appendTo(tcBox);
					$("<p>",{"html":"<strong>New Terms &amp; Conditions</strong>"}).appendTo(tcBox);
					dialogue = $("<p>").appendTo(tcBox)
					$("<a>",{"href":"javascript:void(0);","html":"<span class=\"icon icon-pop-out\"></span> Read The Document"}).click(function() {
						window.open(imageserver+MemBean.agreements.tcLocation);
					}).appendTo(dialogue)
					dialogue = $("<p>").appendTo(tcBox)
					
					// Select
					var selectableP = element("p")
					var selectableInput = element("input", {"type":"checkbox"});
						selectableInput.checked = false;
						selectableInput.onclick = function(event) {
								var target = event.target;
								
								if (target.checked) {
									target.disabled = true;
									var nextClickable = target.parentNode.nextSibling;
									if (nextClickable) {
										nextClickable.classList.remove("hidden");
									}
								}
							}
						selectableP.appendChild(selectableInput)
						
						var thisCaption = (typeof(termsAndConditionsSentence) === "string") ? termsAndConditionsSentence : "Our Terms &amp; Conditions have changed. Please click to indicate that you accept and agree to them."
						selectableP.appendChild(element("span", {"innerHTML": thisCaption}));
						dialogue[0].appendChild(selectableP);
					
					$("<a>",{"href":"javascript:void(0);","class":"hidden confirmAgreeBTN","html":"<span class=\"icon icon-check-circle\"></span> Confirm Agree"}).click(function() {
						$(this).parent().empty().html("<span class=\"icon icon-check-circle\"></span> Thank you!");
						$.getJSON(contextpath+"/member/SetReadTC").done(function() {
							MemBean.agreements.hasreadTC = true;
							
							if (MemBean.agreements.hasreadTC && MemBean.agreements.hasreadPP) {
								lightsOn();
							} else {
								return false;
							}
						})
					}).appendTo(dialogue);
				}
				
				if (!Boolean(args["pp"])) {
					var ppBox = $("<div>",{"class":"clearfix floatright","style":"width: "+width+";"+css}).appendTo(innerDiv);
					var ppBox = $("<div>",{"style":"padding: 5px;"}).appendTo(ppBox);
					$("<p>",{"html":"<strong>New Privacy Policy</strong>"}).appendTo(ppBox);
					dialogue = $("<p>").appendTo(ppBox)
					$("<a>",{"href":"javascript:void(0);","html":"<span class=\"icon icon-pop-out\"></span> Read The Document"}).click(function() {
						window.open(imageserver+MemBean.agreements.ppLocation);
					}).appendTo(dialogue)
					dialogue = $("<p>").appendTo(ppBox);
					
					// Select
					var selectableP = element("p")
					var selectableInput = element("input", {"type":"checkbox"});
						selectableInput.checked = false;
						selectableInput.onclick = function(event) {
								var target = event.target;
								
								if (target.checked) {
									target.disabled = true;
									var nextClickable = target.parentNode.nextSibling;
									if (nextClickable) {
										nextClickable.classList.remove("hidden");
									}
								}
							}
						selectableP.appendChild(selectableInput)
						
						var thisCaption = (typeof(privacyPolicySentence) === "string") ? privacyPolicySentence : "Our Privacy Policy has changed. Please click to indicate that you accept and agree to it."
						selectableP.appendChild(element("span", {"innerHTML": thisCaption}));
						dialogue[0].appendChild(selectableP);
						
					$("<a>",{"href":"javascript:void(0);","class":"hidden confirmAgreeBTN","html":"<span class=\"icon icon-check-circle\"></span> Confirm Agree"}).click(function() {
						$(this).parent().empty().html("<span class=\"icon icon-check-circle\"></span> Thank you!");
						$.getJSON(contextpath+"/member/SetReadPP").done(function() {
							MemBean.agreements.hasreadPP = true;
							
							if (MemBean.agreements.hasreadTC == true && MemBean.agreements.hasreadPP == true) {
								lightsOn();
							} else {
								return false;
							}
						})
					}).appendTo(dialogue);
				}
				
				// Show it
				$(outerDiv).appendTo("body").animate({"opacity":1});
			}
		}
	}
	
	/**
	 * Invoked by the main template.
	 * Checks MemBean data
	 * @invokes displayAgreements {function
	 */
	function checkReadTCPP() {
		if (MemBean && MemBean.agreements) {
			if (!$.isEmptyObject(MemBean) && !$.isEmptyObject(MemBean.agreements)) {
				var displayAgreementsArgs = {"tc":true,"pp":true};
				
				// Check for Terms & Conditions
				if (MemBean.agreements.hasreadTC == false) {
					displayAgreementsArgs['tc'] = false;
				}
				
				// Check for Privacy Policy
				if (MemBean.agreements.hasreadPP == false) {
					displayAgreementsArgs['pp'] = false;
				}
				
				if (!Boolean(displayAgreementsArgs['pp']) || !Boolean(displayAgreementsArgs['tc'])) {
					displayAgreements(displayAgreementsArgs);
				}
			}
		}
	}
	
	// Fix up
	function forceRacepanelChoice() {
		changepanel('racingpanel');
		$("#racingpanel,#racepanel_wrapper,#racingpanel_outer").css({
			"background-image"		: "none",
			"background-color"		: "#000"
		});
		$("#racingpanel,#banner_img").empty();
		
		$("#pan2_col2,#tr-navigation,#tr-updater-search-toggles").slideUp();
		
		// Store in here
		var div = $("<div>");
		
		if (Boolean((AvailSeries && AvailSeries.length))) {
			// This is bad enough
			$("<p>",{"html":"<strong>Stop!</strong>","class":"color_ff0000"}).appendTo(div);
			$("<p>",{"html":"We need to sync up your active content.","class":"color_ffffff"}).appendTo(div);
			$("<p>",{"html":"Please select a race series below to begin:","class":"color_ffffff"}).appendTo(div);
			
			var eligible		= $("<optgroup>",{"label":"Eligible Series"});
			var ineligible		= $("<optgroup>",{"label":"Ineligible Series"});
			for (var i=0;i<AvailSeries.length;i++) {
				var each = AvailSeries[i];
				if (each && each.eligible) {
					if (each.eligible) {
						$("<option>",{"value":each.seasonid,"html":each.seriesname}).appendTo(eligible);
					} else {
						$("<option>",{"value":each.seasonid,"html":each.seriesname}).appendTo(ineligible);
					}
				}
			}
			
			if (($(eligible).children().size()>0) || ($(ineligible).children().size()>0)) {
				var select = $("<select>").change(function() {
					selectSeries(this.value);
					$(this).fadeOut(function() {
						$("<p>",{"html":"Selecting series...please wait...","class":"color_ffffff"}).insertAfter($(this));
					})
				}).appendTo(div);
				$("<option>",{"value":"-1","html":"Select Series:","disabled":"disabled","selected":"selected"}).appendTo(select);
				if ($(eligible).children().size()>0) $(eligible).appendTo(select);
				if ($(ineligible).children().size()>0) $(ineligible).appendTo(select);
			} else {
				$("<p>",{"html":"Error!","class":"color_ff0000"}).appendTo(div);
				$("<p>",{"html":"Please contact <a href=\"/membersite/member/help.jsp\" class=\"color_ff0000\" target=\"_blank\">support</a> and reference 'racepanel_err_FRC02'","class":"color_ffffff"}).appendTo(div);
			};
		} else {
			// This is really bad
			$("<p>",{"html":"<strong>We've encountered a critical error!</strong>","class":"color_ff0000"}).appendTo(div);
			$("<p>",{"html":"Please contact <a href=\"/membersite/member/help.jsp\" class=\"color_ff0000\" target=\"_blank\">support</a> and reference 'racepanel_err_FRC01'","class":"color_ffffff"}).appendTo(div);
		}
		
		// Insert information
		$(div).appendTo("#racingpanel");
		
		var whichOne = Number(Math.floor((Math.random() * Number(AvailSeries.length))));
			whichOne = deepClone(AvailSeries[whichOne]);
	}
	
	function RubberDubberCaption(x,carryover,showPCT) {
		// Captions
		var Caption = "";
		
		// Parse!
		if (x == -1) {
			Caption = "Automatically Generated";
			if (Boolean(carryover) == true) Caption = "Carried over";
		}
		else if ((x >= 0) && (x <= 100)) {
			if (x < 5)						Caption = "Clean";
			if ((x >= 5) && (x < 16))		Caption = "Slight Usage";
			if ((x >= 16) && (x < 29))		Caption = "Low Usage";
			if ((x >= 29) && (x < 43))		Caption = "Moderately Low Usage";
			if ((x >= 43) && (x < 58))		Caption = "Moderate Usage";
			if ((x >= 58) && (x < 72))		Caption = "Moderately High Usage";
			if ((x >= 72) && (x < 85))		Caption = "High Usage";
			if ((x >= 85) && (x < 96))		Caption = "Extensive Usage";
			if ((x >= 96))					Caption = "Maximum Usage";
		}
		
		return Caption + ((Boolean(showPCT) == true) ? ((x>=0)?" ("+x+"%)":"") : "");
	};
	
	function MakeRubberDetails(data,mode,target,showPCT) {
		// Make a string and return it
		if (mode == "string") {
			var Return = "";
			
			if ((data == null) || (data == undefined)) {
				return Return;
			}
			
			data = normalizeObject(data);
			
			if (data.leavemarbles && (data.leavemarbles == 1) || (data.leavemarbles == 0)) {
				Return += "<strong>Auto-Clean Marbles:</strong> "+((!Boolean(data.leavemarbles))?"Yes":"No");
			}
			
			
			if (parseInt(data.rubberlevelpractice))			Return += "<br /><strong>Practice:</strong> "+(RubberDubberCaption(data.rubberlevelpractice));
				var CarryOver = ((data.rubberlevelwarmup != null) && (data.rubberlevelwarmup == -1))?true:false;
			if (parseInt(data.rubberlevelwarmup))			Return += "<br /><strong>Warmup:</strong> "+(RubberDubberCaption(data.rubberlevelwarmup,		Boolean(CarryOver),		Boolean(showPCT)));
				var CarryOver = ((data.rubberlevelqualify != null) && (data.rubberlevelqualify == -1))?true:false;
			if (parseInt(data.rubberlevelqualify))			Return += "<br /><strong>Qualify:</strong> "+(RubberDubberCaption(data.rubberlevelqualify,		Boolean(CarryOver),		Boolean(showPCT)));
			var CarryOver = ((data.rubberlevelrace != null) && (data.rubberlevelrace == -1))?true:false;
			if (parseInt(data.rubberlevelrace))				Return += "<br /><strong>Race:</strong> "+(RubberDubberCaption(data.rubberlevelrace,			Boolean(CarryOver),		Boolean(showPCT)));
			
			return Return;
		}
		// Make a table and add it using addRow()
		else if ((mode == "table") && (target != null)) {
			
			if ((data == null) || (data == undefined)) {
				return false;
			}
			
			data = normalizeObject(data);
			
			// Marble setting?
			if (String(data.leavemarbles).length > 0) {
				addRow(target, "Auto-Clean Marbles", (!Boolean(data.leavemarbles))?"Yes":"No");
			}
			// Do the rubber details
			var carryover = false;
			if (parseInt(data.rubberlevelpractice) != NaN && data.rubberlevelpractice != null) {
				addRow(target, "Practice", RubberDubberCaption(data.rubberlevelpractice,	carryover,		Boolean(showPCT)));
				carryover = true;
			}
			if (parseInt(data.rubberlevelqualify) != NaN && data.rubberlevelqualify != null) {
				addRow(target, "Qualify", RubberDubberCaption(data.rubberlevelqualify,		carryover,		Boolean(showPCT)));
				carryover = true;
			}
			if (parseInt(data.rubberlevelwarmup) != NaN && data.rubberlevelwarmup != null) {
				addRow(target, "Warmup", RubberDubberCaption(data.rubberlevelwarmup,		carryover,		Boolean(showPCT)));
				carryover = true;
			}
			if (parseInt(data.rubberlevelrace) != NaN && data.rubberlevelrace != null) {
				addRow(target, "Race", RubberDubberCaption(data.rubberlevelrace,			carryover,		Boolean(showPCT)));
				carryover = true;
			}
		} else return "";
	}
	
	function MakeHeatRaceDetails(heatInfoObj) {
		var details = heatInfoObj.max_entrants + " max entries<br/>";
		if (heatInfoObj.qual_style > 0) {
			details += heatInfoObj.qual_laps + " laps ";
			details += (heatInfoObj.qual_style == 1 ? "lone" : "open");
			details += " qual, adv. " + heatInfoObj.qual_num_to_main + "<br/>";
		} else {
			details += "No qual<br/>";
		}
		details += heatInfoObj.heat_laps + " lap heats of max ";
		details += heatInfoObj.heat_max_field + " drivers, adv. max ";
		details += heatInfoObj.heat_num_to_main + ", invert ";
		details += heatInfoObj.heat_num_to_invert + "<br/>";
		if (heatInfoObj.consol_num_to_consol == 0 && heatInfoObj.consol_num_to_main == 0) {
			details += "No consol<br/>";
		} else {
			details += heatInfoObj.consol_first_laps + " lap ";
			details += heatInfoObj.consol_num_to_consol == 0 ? "non-stacked" : "stacked";
			details += " consols of max ";
			details += heatInfoObj.consol_first_max_field + " drivers, invert ";
			details += heatInfoObj.consol_num_to_invert + "<br/>";
		}
		details += heatInfoObj.main_laps + " lap main of max ";
		details += heatInfoObj.main_max_field + " drivers, invert ";
		details += heatInfoObj.main_num_to_invert;
		return details;
	}
	
	// Not used but useful later
	function Rot13(str) {
		return str.replace(/[a-zA-Z]/g, function(chr) {
			var start = chr <= 'Z' ? 65 : 97;
			return String.fromCharCode(start + (chr.charCodeAt(0) - start + 13) % 26);
		});
	}
	
	function ValidateEmailAddress(str) {
		var at="@"
		var dot="."
		var lat=str.indexOf(at)
		var lstr=str.length
		var ldot=str.indexOf(dot)
		if (str.indexOf(at)==-1){
		   return false;
		}

		if (str.indexOf(at)==-1 || str.indexOf(at)==0 || str.indexOf(at)==lstr){
		   return false;
		}

		if (str.indexOf(dot)==-1 || str.indexOf(dot)==0 || str.indexOf(dot)==lstr){
		    return false;
		}

		 if (str.indexOf(at,(lat+1))!=-1){
		    return false;
		 }

		 if (str.substring(lat-1,lat)==dot || str.substring(lat+1,lat+2)==dot){
		    return false;
		 }

		 if (str.indexOf(dot,(lat+2))==-1){
		    return false;
		 }
			
		 if (str.indexOf(" ")!=-1){
		    return false;
		 }
		 return true;
	}
	
	// Used to check if an attribute / node exists in an object
	function FindAttributByName(obj,name) {
		var Match = false;
		for (var k in obj) {
			if (String(k) == String(name)) {
				Match = true;
				break;
			}
		}
		return Match;
	}
	
	// Checks eligibility to an invitational season - now must guard all official series
	function IsAllowedToJoinInvitational(SeasonID,TeamID,CarID,Location) {
		if (SeasonID == undefined)					return false;
		if (TeamID == undefined || TeamID > 0)		return false;
		
		if (!Location)		Location = "unspecified";
		
		// Get season details
		var Season					= getSeasonByID(SeasonID);
		if (Season == null) return {"IsAllowed":false,"MSG":"Invalid season selected."};
		
		// Not restricted
		if (!Season.restrictedByMember && !Season.restrictedToCar) {
			return {"IsAllowed":true,"MSG":""};
		}
		// Has a restriction of some type.
		else {
			// Factors to validate
			var IsTeamOnTheList			= false;
			var AmIOnTheList			= false;
			var IsCarAllowed			= false;
			
			// Am I (and my team) on the list?
			if (Season.restrictedByMember == true) {
				var AllowedIndex			= Season.allowedMembers.objIndexOf(MemBean.custid, "custId");
				if (AllowedIndex != -1) {
					AmIOnTheList			= true;
					if (Season.allowedMembers[AllowedIndex].teamId != undefined) {
						if (TeamID == Season.allowedMembers[AllowedIndex].teamId) IsTeamOnTheList = true;
					} else {
						 IsTeamOnTheList = true;
					}
				}
			} else {
				AmIOnTheList = true;
				IsTeamOnTheList = true;
			}
			
			// Is car allowed
			if (Season.restrictedToCar == true) {
				var carNumberMap			= Season.carNumberMap.carNumberMap; // hey dawg
				// Sometimes the numbermap might be easy (in the case that it thinks it's restricted but totally isn't)
				if (!$.isEmptyObject(Season.carNumberMap.carNumberMap)) {
					var AllowedCars				= null;
					if (Season.carNumberMap.carNumberMap) {
						for (var k in carNumberMap) {
							// Team and car matchup
							
							if ( Number(k) == TeamID && ( FindAttributByName(carNumberMap[k],String(CarID)) ) ) {
								IsCarAllowed	= true;
								break;
							}
						}
					}
				} else {
					IsCarAllowed			= true;
				}
			} else {
				IsCarAllowed			= true;
			}
			
			// Error Messages
			var MSG_TeamNotAllowed			= "This is an invitational session, and you are not on a team that is allowed to join.";
			var MSG_MemberNotAllowed		= "This is an invitational session, and you aren't allowed to join.";
			var MSG_CarNotAllowed			= "This is an invitational session with a car restriction, and the selected car isn't allowed to be driven. Perhaps you are allowed to join using another car?";
			
			
			// Restricted by member but not by car
			if (Season.restrictedByMember && !Season.restrictedToCar) {
				// Am I and the team on the list
				if (AmIOnTheList && IsTeamOnTheList) {
					return {"IsAllowed":true,"MSG":""};
				} else {
					if (!AmIOnTheList) {
						return {"IsAllowed":false,"MSG":MSG_MemberNotAllowed};
					} else if (!IsTeamOnTheList) {
						return {"IsAllowed":false,"MSG":MSG_TeamNotAllowed};
					} else {
						return {"IsAllowed":false,"MSG":MSG_MemberNotAllowed};
					}
				}
			}
			// Restricted not by member but by car
			else if (!Season.restrictedByMember && Season.restrictedToCar) {
				// Is the car combination I chose on the list
				if (IsCarAllowed) {
					return {"IsAllowed":true,"MSG":""};
				} else {
					return {"IsAllowed":false,"MSG":MSG_CarNotAllowed};
				}
			}
			// Restricted by car and member
			else if (Season.restrictedByMember == true && Season.restrictedToCar == true) {
				if (AmIOnTheList && IsTeamOnTheList && IsCarAllowed) {
					return {"IsAllowed":true,"MSG":""};
				} else {
					if (!AmIOnTheList) {
						return {"IsAllowed":false,"MSG":MSG_MemberNotAllowed};
					} else if (!IsTeamOnTheList) {
						return {"IsAllowed":false,"MSG":MSG_TeamNotAllowed};
					} else if (!IsCarAllowed) {
						return {"IsAllowed":false,"MSG":MSG_CarNotAllowed};
					}
					else {
						return {"IsAllowed":false,"MSG":MSG_MemberNotAllowed};
					}
				}
			}
		}
		
		// U wot m8
		return {"IsAllowed":false,"MSG":"The combination of selected season, team, and car is invalid for the session.<br /><br /><strong>Please contact support and provide the following details:</strong><br />(Error Code RP-M8, SeasonID: " + SeasonID + ", TeamID: " + TeamID + ", CarID: " + CarID + " CustID: " + MemBean.custid+", Location: " + Location + ")"};
	}
	
	SteamLoginTimer = null;
	function SteamLogin(LinkElement) {
		clearTimeout(SteamLoginTimer);
		
		$("<span>", {
			"html"			: "Please wait...",
			"id"			: "SteamWait",
			"style"			: "float: none; margin: 0; color: red;"
		}).insertBefore(LinkElement);
		
		$(LinkElement).hide();
		
		$.ajax(contextpath+"/GetSteamLoginURL").success(function(data) {
			var URL						= data.replace("'","");
			document.location.href		= URL;
		}).fail(function() {
			iRacingAlerts("Sorry, we are having trouble logging you in via Steam. Please wat a few moments, refresh the page, and try again. If you continue to experience problems, please contact iRacing support and mention error code <strong>STM-02</strong>.");
		}).complete(function() {
			$(LinkElement).show();
			$("#SteamWait").remove();
		});
		
		SteamLoginTimer = setTimeout(function() {
			$(LinkElement).show();
			$("#SteamWait").remove();
		}, 5000);
	}
	
	function GetTrackByPackageID(sku) {
		sku = Number(sku);
		
		var Return = {};
		
		var NDX = TrackListing.objIndexOf(sku,"pkgid");
		if (NDX != -1) {
			Return = TrackListing[NDX];
		}
		
		return Return;
	}
	
	// Use the lookup data to get a time of day
	function GetTimeOfDay(ID,GetObject) {
		var ID = Number(ID);
		if (!GetObject) GetObject == false;
		else GetObject = Boolean(GetObject);
		ReturnObj = "N/A";
		var NDX = TimesOfDayListing.objIndexOf(ID,"ID");
		if (NDX != -1) {
			ReturnObj = (GetObject == true) ? TimesOfDayListing[NDX] : TimesOfDayListing[NDX].Name;
		}
		return ReturnObj;
	}

	// Kill Cufon!
	var Cufon = {
		replace		: function() { return false; },
		now			: function() { return false; },
		refresh		: function() { return false; },
		DOM			: {
			ready	: function() { return false; }
		}
	}
	
    // Big old strip function
    // Removes bad curly quotes
    function StripStuff(string) {
    	originalstring = deepClone(string);
    	try {
			string = string.replace( /\u2018|\u2019|\u201A|\uFFFD/g, "'" );
			string = string.replace( /\u201c|\u201d|\u201e/g, '"' );
			string = string.replace( /\u02C6/g, '^' );
			string = string.replace( /\u2039/g, '<' );
			string = string.replace( /\u203A/g, '>' );
			string = string.replace( /\u2013/g, '-' );
			string = string.replace( /\u2014/g, '--' );
			string = string.replace( /\u2026/g, '...' );
			string = string.replace( /\u00A9/g, '(c)' );
			string = string.replace( /\u00AE/g, '(r)' );
			string = string.replace( /\u2122/g, 'TM' );
			string = string.replace( /\u00BC/g, '1/4' );
			string = string.replace( /\u00BD/g, '1/2' );
			string = string.replace( /\u00BE/g, '3/4' );
			string = string.replace(/[\u02DC|\u00A0]/g, " ");
    	} catch(e) {
    		console.warn("Couldn't strip from string:")
    		console.log(string)
    		string = originalstring;
    	}
    	return string;
    }
	
	// Hide it
	HideDataIsRetrievingTimer = null;
	function HideDataIsRetrieving() {
		clearTimeout(HideDataIsRetrievingTimer);
		$("#Loading-Data-Container").remove();
	}
	
	// Show data is being retrieved
	function ShowDataIsRetrieving(callback) {
		// Rmove existing
		HideDataIsRetrieving();
		
		// Make a div
		var LoadingDiv = $("<div>", {
			"id"			: "Loading-Data-Container"
		}).appendTo("#Main-Layout");
		
			// Relative
			var RelDiv = $("<div>", {"class" : "Inner-Relative-Container"}).appendTo(LoadingDiv);
			
			// Show loading
			SpinnyDiv = $("<div>", {"class"	: "Spinning-Wheel-Container"}).appendTo(RelDiv);
				
				$("<i>", {"class":"icon icon-loading"}).appendTo(SpinnyDiv)
				
				$("<p>", {
					"html"		: "Please wait, processing data just for you...",
					"class"		: "Loading-MSG"
				}).appendTo(RelDiv);
				
				HideDataIsRetrievingTimer = setTimeout(function() {
					HideDataIsRetrieving();
				}, (60 * 1000));
	}
	
	// URL Parameter
    function getURLParamByName(name) {
        // Filter
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
        
        // Make Regex
        var regexS = "[\\?&]"+name+"=([^&#]*)";  
        var regex = new RegExp(regexS);  
        
        // Test out
        var results = regex.exec(window.location.href);
         
         if (results == null) {
             return null;
        } else {
            return results[1];
        };
    };
	
	function logToConsole(msg) {
		return false;
	}
	
	
	function getIcon(name) {
		return element("span", {"className": String("icon-" + name.toLowerCase())});
	}
	
	function validateColorString(color) {
		if (!color) return false;
		return (/^[0-9A-F]{6}$/gi.test(String(color).replace("#", "")));
	}
	
	function cleanColorString(color, add_hex) {
		if (!color) return undefined;
		if (!validateColorString(color)) return undefined;
		return String( ((add_hex) ? "#" : "") + String(color).replace("#", "").substring(0, 6).toUpperCase());
	}
	
	function getCarsByClass(car_class) {
		var cars = new Array();
		
		if (parseInt(car_class) >= 0) {
			var idx = CarClassListing.objIndexOf(parseInt(car_class), "id");
			if (idx !== -1) {
				var the_class = CarClassListing[idx];
				if (!$.isEmptyObject(the_class) && the_class.carsinclass.length) {
					the_class.carsinclass.map(function(car) {
						var specific_car = getCarById(car.id);
						if (specific_car !== null) {
							cars.push(cloneObj(specific_car));
						}
					})
					
				}
				
			}
		}
		
			
		return cars;
	}
	
	function GetSkiesById(id) {
		var skies = [];
		var ndx = weatherSkies.objIndexOf(String(id), "lookup_value");
		if (ndx !== -1) {
			skies = weatherSkies[ndx];
		}
		return skies;
	}
	
	function GetMemberCar(id) {
		var car = {};
		var ndx = MemberCarListing.objIndexOf(parseInt(id), "id");
		if (ndx !== -1) {
			car = cloneObj(MemberCarListing[ndx]);
		}
		return car;
	}
	
	function GetWindDirection(id) {
		var wind = [];
		var ndx = weatherWindDirection.objIndexOf(String(id), "lookup_value");
		if (ndx !== -1) {
			wind = weatherWindDirection[ndx];
		}
		return wind;
	}
	
	function msToPrettyTime(s) {
		var ms			= Number(moment.duration(s/10000).milliseconds());
		var ms_d		= String(ms).split(".");
			if (ms_d.length === 2) {
				ms_d = ms_d[1].substring(0,3); // Use this because toFixed() rounds
			}
		var secs		= Number(moment.duration(s/10).seconds());
		var mins		= Number(moment.duration(s/10).minutes());

		return String(
			((mins > 0) ? mins + ":" : "0:") +
			((secs >= 0) ? ((String(secs).length < 2) ? ("0" + secs) : secs) : "0") +
			"." +
			(ms_d)
		);
	}
	
	function alphabetizeSelect(select) {
		return $(select).html($(select).children("option").sort(function (a, b) {
		    return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
		}))[0];
	}
	
	function goNaked(ok, fail, landingURL) {
		var targetURL = (landingURL || "");
		
		var url = localserver + "/gonaked" +
								"?customerid=" + MemBean.custid +
								"&sess_cred_srv=" + js_sess_cred_srv +
								"&sess_cred=" + js_sess_creds +
								"&OK=" + (ok || contextpath) +
								"&FAIL=" + (fail || contextpath);
		if (typeof(targetURL) === "string" && targetURL.length) {
			url = url + "&landingurl=" + encodeURIComponent(targetURL);
		}
		
		location = url;
	}
	
	/**
	 * Tells us if something is a function
	 * @param test {anything}
	 * @returns {boolean}
	 */
	function isFunction(test) {
		return (typeof(test) === "function");
	}
	
	/**
	 * Tells us if something is a string
	 * @param test {anything}
	 * @returns {boolean}
	 */
	function isString(test) {
		return typeof(test) === "string";
	}
	
	/**
	 * Checks for a series and if it has special rules
	 * 
	 * @param series_id {int}
	 * 
	 */
	function checkForSeriesAcceptance(series_id) {
		
		// Validate
		var seriesIDValid = (parseInt(series_id) > 0);
		if (!seriesIDValid) {
			series_id = 0;
		}
		
		// Final obj
		var returnObj = {};
		
		// Find index
		var seriesIndex = seriesWithTerms.objIndexOf(series_id, "series_id");
		if (seriesIndex !== -1) {
			returnObj = seriesWithTerms[seriesIndex];
		}
		
		return returnObj;
	}
	
	/**
	 * A way to asynchronously get a member preference with callbacks
	 * 
	 * @param pref_name {string} preference name
	 * @param default_value {string} default value if it doesn't exist
	 * @param successFunc {function} a function to invoke when it comes back
	 * @param failureFunc {function} a function to invoke if it fails
	 * 
	 * @returns {JSON}
	 */
	function getMemberPreferenceAjax(pref_name, default_value, successFunc, failureFunc) {
		
		// Hide Loading
		HideDataIsRetrieving();

		// Validata
		pref_name = (isString(pref_name) && pref_name.length) ? pref_name.trim() : "";
		default_value = (isString(default_value)) ? default_value : "";
		
		if (pref_name.length) {
			
			var theURL = String(contextpath + "/member/GetMemberPreference?preferenceName=" + pref_name);
			if (default_value.length) theURL += String("&defaultValue=" + default_value);
			
			ShowDataIsRetrieving();
			
			$.getJSON(theURL).done(function(response) {
				HideDataIsRetrieving();
				
				if (isFunction(successFunc)) {
					successFunc(response);
				} else {
					console.log("No success callback");
					console.log(response);
				}
			}).error(function(err) {
				HideDataIsRetrieving();
				
				if (isFunction(failureFunc)) {
					failureFunc(err);
				} else {
					console.log("No failure callback");
					console.log(err);
				}
			});
		};
	};
	
	/**
	 * Closes all modals, loaders, etc, and shows a "you must register" screen for a series that requires a terms or acceptance
	 * @param series_terms
	 * @param bound_register_action
	 * @returns {bool} success state
	 */
	function showSeriesTermsAcceptModal(series_terms, bound_register_action) {
		
		if (!isFunction(bound_register_action)) {
			console.warn("No bound func supplied");
			return false;
		}
		
		if (series_terms === undefined || typeof(series_terms) !== "object") {
			console.warn("Bad series terms supplied");
			return false;
		}
		
		lightsOn();
		lightsOut();
		
		var outerDiv = $("<div>", {
			"id"			: "iracing-terms",
			"style"			: "display: block; opacity: 0; z-index: 21; background: #f5f5f5; text-shadow: 0 1px 0 #fff; width: 500px; position: fixed; left: "+Number(($(window).width()/2) - 250)+"px; top: 20%; margin: -100px 0 0; padding: 0;"
		}).animate({"opacity":0});
		
		// Body
		var innerDiv = $("<div>", {
			"style"			: "padding: 10px;"
		}).appendTo(outerDiv);
			
		$("<h1>", {
			"html": "<strong style=\"font-size: 16pt;\">Important</strong>"
		}).appendTo(innerDiv);
		
		$("<p>", {"html": series_terms.acceptance_msg}).appendTo(innerDiv);
		
		var linkContainer = $("<div>").appendTo(innerDiv);
		var linkP = $("<p>", {"html": "", "style": "text-align: center;"}).appendTo(linkContainer);
		$("<a>", {
			html: "<span class=\"icon icon-pop-out\"></span> Open document in new window",
			href: series_terms.terms_doc_url,
			"target": "_blank"
		}).appendTo(linkP)
		
		var isFirefox = ($.browser.mozilla === true && navigator.userAgent.indexOf("Trident") === -1);
		
		if (!isFirefox) {
			var frameContainer = $("<div>").appendTo(innerDiv);
			
			$("<iframe>", {
				"src": series_terms.terms_doc_url,
				"style": "width: 100%; border: 1px solid #aaa; height: 300px;"
			}).appendTo(frameContainer);
		}
		
		var btnContainer = $("<div>", {"style": "display: block; width: 150px; margin: auto;"}).appendTo(innerDiv);
		
		$("<a>", {
			"html": "I Accept",
			"href": "#",
			"class": "toolbar-button-right",
			"style": "background-color: #3fda3f;"
		}).click(function() {
			
			var preferenceKey = String("accepted_terms_seriesid_" + series_terms.series_id);
			var newPrefValue = String(Date.now());
			
			removeUILoaders();
			lightsOn();
			
			setTimeout(function() {
				
				// Set member preference
				sendMemberPreferenceToHost(
					preferenceKey,
					newPrefValue,
					function(response) {
						// Looking for success: true
						
						// ... set member preference manually
						MemPrefsListing[preferenceKey] = newPrefValue
						
						// Then invoke function
						bound_register_action();
					}
				)
				
			}, 500);
			
			return false;
			
			
		}).appendTo(btnContainer)
		$("<a>", {
			"html": "Cancel",
			"href": "#",
			"class": "toolbar-button-right"
		}).click(function() {
			removeUILoaders();
			lightsOn();
			return false;
		}).appendTo(btnContainer)
		
		
		$(outerDiv).appendTo("body").animate({"opacity":1});
		
		// Always recenter it
		window.addEventListener("resize", function() {
			clearTimeout(window["seriesTermsResizeTimer"]);
			window["seriesTermsResizeTimer"] = setTimeout(function() {
				$("#iracing-terms").css({
					"left": String(Number(($(window).width()/2) - ($("#iracing-terms").width()/2))+"px")
				});
			}, 100);
		});
		
		return true;
	}
	
	function removeUILoaders() {
		if (typeof(UI) !== "undefined") {
			if (typeof(UI.removeAllPreloaders) !== "undefined") {
				UI.removeAllPreloaders();
			}
		}
	}

	/**
	 * Takes url params and turns them into an object.
	 * Should be able to almost function as the reverse of serializeObject()
	 * except that everything comes out as strings
	 *
	 * @param string {string} something with url key value pairs (a=1&b=banana)
	 * @return {object}
	 *
	 */
	function urlParamsToObject(string) {
		var returnObject = {};

		if (isString(string)) {
			var separated = string.split("&");
			if (separated.length) {
				separated.map(function(pair) {
					var separatedPair = pair.split("=");
					if (separatedPair.length === 2) {
						returnObject[separatedPair[0]] = separatedPair[1];
					}
				})
			};
		};

		return returnObject;
	}
	
	/**
	 * Takes an object and turns the key/values into a url parameter string **(has test)**
	 * @param {object} obj - an object
	 * @return {string} a serialized string for a url (a=b&c=d)
	 */
	function serializeObject(obj) {
		if (obj && typeof(obj) === "object" && !Array.isArray(obj)) {
		    var pairs = [];
		    for (var prop in obj) {
		        if (!obj.hasOwnProperty(prop)) {
		            continue;
		        }
		        if (Object.prototype.toString.call(obj[prop]) === "[object Object]") {
		            pairs.push(serializeObject(obj[prop]));
		            continue;
		        }
		        pairs.push(prop + "=" + obj[prop]);
		    }
		    return pairs.join("&");
		} else {
			return obj;
		}
	}
	
	// get date and time of day, then figure out sunrise/sunset
	// use may 15th for northern hemi, nov 15 for southern
	function getTimeOfDayDateTimeForTrack(timeOfDay, track) {
		var theDate = {y: new Date().getFullYear(), M:(track.latitude < 0 ? 10 : 4), d:15, h:13, m:0, s:0};
		var startMoment = moment.tz(theDate, track.timeZoneId);
		
		var angle = 0;
		var useRise = false;
		
		switch(timeOfDay) {
		case 0:
			angle = SunCalc.afternoon;
			useRise = false;
			break;
		case 1:
			angle = SunCalc.morning;
			useRise = true;
			break
		case 2:
			angle = SunCalc.lateAfternoon;
			useRise = false;
			break;
		case 3:
			angle = SunCalc.nauticalDawnDusk;
			useRise = false;
			break;
		case 5:
			angle = SunCalc.sunriseSunset;
			useRise = true;
			break;
		case 6:
			angle = SunCalc.goldenHour;
			useRise = true;
			break;
		case 7:
			angle = SunCalc.goldenHour;
			useRise = false;
			break;
		case 8:
			angle = SunCalc.sunriseSunset;
			useRise = false;
			break;
		}
		
		var initialNeg = angle < 0;
		var useCalc;
		do {
			var calcs = SunCalc.getAngleTime(angle, startMoment.toDate(), track.latitude, track.longitude);
			useCalc = useRise ? calcs.rise : calcs.set;
			if (initialNeg) {
				if (angle > 0) {
					break;
				}
				angle += 1.0;
			} else {
				if (angle < 0) {
					break;
				}
				angle -= 1.0;
			}
		} while (isNaN(useCalc));
		
		if (!isNaN(useCalc)) {
			startMoment = moment.tz(useCalc, track.timeZoneId);
		}
		return {startMoment:startMoment,calcs:calcs};
	}
	
	function isDynamicWeather(val) {
		return val == 1 || val == 2;
	}
	
	function isDynamicSkies(val) {
		return val == 1 || val == 3;
	}
	
// We're loaded
var iracingScriptLoaded = true;
